import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { ArrowLeft, MapPin, DollarSign, Calendar, Bookmark, BookmarkCheck, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export const Route = createFileRoute("/jobs/$jobId")({
  component: JobDetail,
});

interface Job {
  id: string;
  employer_id: string;
  title: string;
  company: string;
  description: string;
  category: string;
  location: string;
  is_remote: boolean;
  hourly_pay: number | null;
  created_at: string;
}

const appSchema = z.object({
  note: z.string().trim().min(10, "Tell the employer a bit about you (10+ chars)").max(1000),
  contact_email: z.string().email(),
  contact_phone: z.string().trim().max(40).optional().or(z.literal("")),
});

function JobDetail() {
  const { jobId } = Route.useParams();
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [job, setJob] = useState<Job | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [saved, setSaved] = useState(false);
  const [applied, setApplied] = useState(false);

  const [form, setForm] = useState({ note: "", contact_email: "", contact_phone: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("jobs").select("*").eq("id", jobId).maybeSingle();
      if (!data) return setNotFound(true);
      setJob(data as Job);
    })();
  }, [jobId]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: s }, { data: a }] = await Promise.all([
        supabase.from("saved_jobs").select("id").eq("job_id", jobId).eq("student_id", user.id).maybeSingle(),
        supabase.from("applications").select("id").eq("job_id", jobId).eq("student_id", user.id).maybeSingle(),
      ]);
      setSaved(!!s);
      setApplied(!!a);
      setForm((f) => ({ ...f, contact_email: user.email ?? "" }));
    })();
  }, [user, jobId]);

  const toggleSave = async () => {
    if (!user) return navigate({ to: "/auth" });
    if (saved) {
      await supabase.from("saved_jobs").delete().eq("job_id", jobId).eq("student_id", user.id);
      setSaved(false);
    } else {
      await supabase.from("saved_jobs").insert({ job_id: jobId, student_id: user.id });
      setSaved(true);
      toast.success("Saved");
    }
  };

  const apply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return navigate({ to: "/auth" });
    const parsed = appSchema.safeParse(form);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setSubmitting(true);
    const { error } = await supabase.from("applications").insert({
      job_id: jobId,
      student_id: user.id,
      note: parsed.data.note,
      contact_email: parsed.data.contact_email,
      contact_phone: parsed.data.contact_phone || null,
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    setApplied(true);
    toast.success("Application sent!");
  };

  const deleteJob = async () => {
    if (!confirm("Delete this listing?")) return;
    const { error } = await supabase.from("jobs").delete().eq("id", jobId);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    navigate({ to: "/dashboard" });
  };

  if (notFound) return (
    <div className="container mx-auto max-w-2xl px-4 py-20 text-center">
      <h1 className="font-display text-3xl font-semibold">Job not found</h1>
      <Button asChild className="mt-6"><Link to="/jobs">Back to jobs</Link></Button>
    </div>
  );

  if (!job) return (
    <div className="container mx-auto max-w-3xl px-4 py-10 space-y-4">
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-64 w-full" />
    </div>
  );

  const isOwner = user?.id === job.employer_id;
  const canApply = profile?.role === "student";

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <Link to="/jobs" className="inline-flex items-center text-sm text-muted-foreground hover:text-accent">
        <ArrowLeft className="mr-1 h-4 w-4" /> All jobs
      </Link>

      <div className="mt-6 rounded-2xl border bg-card p-8 shadow-[var(--shadow-card)]">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{job.category}</Badge>
          {job.is_remote && <Badge className="bg-success text-success-foreground hover:bg-success">Remote</Badge>}
        </div>
        <h1 className="mt-3 font-display text-3xl font-bold sm:text-4xl">{job.title}</h1>
        <p className="mt-1 text-lg text-muted-foreground">{job.company}</p>

        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{job.location}</span>
          {job.hourly_pay && (
            <span className="flex items-center gap-1.5"><DollarSign className="h-4 w-4" />${Number(job.hourly_pay).toFixed(2)}/hr</span>
          )}
          <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" />{new Date(job.created_at).toLocaleDateString()}</span>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {!isOwner && profile?.role !== "employer" && (
            <Button variant="outline" onClick={toggleSave}>
              {saved ? <><BookmarkCheck className="mr-2 h-4 w-4" />Saved</> : <><Bookmark className="mr-2 h-4 w-4" />Save</>}
            </Button>
          )}
          {isOwner && (
            <Button variant="outline" onClick={deleteJob}>
              <Trash2 className="mr-2 h-4 w-4" />Delete listing
            </Button>
          )}
        </div>

        <div className="prose prose-sm mt-8 max-w-none whitespace-pre-wrap text-foreground/90">
          {job.description}
        </div>
      </div>

      {/* Apply */}
      {!isOwner && canApply && (
        <Card className="mt-8 shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle className="font-display">{applied ? "Application sent" : "Quick apply"}</CardTitle>
          </CardHeader>
          <CardContent>
            {applied ? (
              <p className="text-sm text-muted-foreground">You've already applied to this job. The employer will reach out via your contact info.</p>
            ) : (
              <form onSubmit={apply} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="note">Cover note</Label>
                  <Textarea id="note" rows={5} required value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Briefly tell the employer why you're a good fit and your availability." />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email">Contact email</Label>
                    <Input id="email" type="email" required value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Contact phone (optional)</Label>
                    <Input id="phone" value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} />
                  </div>
                </div>
                <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
                  {submitting ? "Sending..." : "Send application"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      )}

      {!user && (
        <Card className="mt-8">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 py-6">
            <p className="text-sm text-muted-foreground">Sign in as a student to apply or save this job.</p>
            <Button asChild><Link to="/auth">Sign in</Link></Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
