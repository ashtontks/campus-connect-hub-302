import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { CATEGORIES } from "./jobs.index";

export const Route = createFileRoute("/jobs/new")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/auth" });
  },
  head: () => ({ meta: [{ title: "Post a job — ShiftIn" }] }),
  component: NewJob,
});

const schema = z.object({
  title: z.string().trim().min(3).max(120),
  company: z.string().trim().min(1).max(120),
  description: z.string().trim().min(20).max(5000),
  category: z.string(),
  location: z.string().trim().min(1).max(120),
  is_remote: z.boolean(),
  hourly_pay: z.number().min(0).max(10000).nullable(),
  working_hours: z.string().trim().max(120).optional().or(z.literal("")),
});

function NewJob() {
  const { profile, loading } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "",
    company: "",
    description: "",
    category: "Hospitality",
    location: "",
    is_remote: false,
    hourly_pay: "",
  });

  if (loading) return <div className="container mx-auto p-10">Loading…</div>;

  if (profile && profile.role !== "employer") {
    return (
      <div className="container mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-semibold">Only employers can post jobs</h1>
        <p className="mt-2 text-muted-foreground">Your account is set to “Student”. Create an employer account to post listings.</p>
        <Button asChild className="mt-6"><Link to="/jobs">Browse jobs</Link></Button>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({
      ...form,
      hourly_pay: form.hourly_pay === "" ? null : Number(form.hourly_pay),
    });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);

    setSubmitting(true);
    const { data: userData } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("jobs")
      .insert({ ...parsed.data, employer_id: userData.user!.id })
      .select("id")
      .single();
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Job posted!");
    navigate({ to: "/jobs/$jobId", params: { jobId: data.id } });
  };

  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      <Card className="shadow-[var(--shadow-card)]">
        <CardHeader>
          <CardTitle className="font-display text-2xl">Post a part-time job</CardTitle>
          <CardDescription>Reach students looking for flexible work.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="title">Job title</Label>
              <Input id="title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Barista (weekends)" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input id="company" required value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="loc">Location</Label>
                <Input id="loc" required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Boston, MA" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="pay">Hourly pay (USD)</Label>
                <Input id="pay" type="number" step="0.5" value={form.hourly_pay} onChange={(e) => setForm({ ...form, hourly_pay: e.target.value })} placeholder="18" />
              </div>
              <div className="flex items-end justify-between rounded-md border border-input px-3 py-2">
                <Label htmlFor="rem" className="cursor-pointer">Remote-friendly</Label>
                <Switch id="rem" checked={form.is_remote} onCheckedChange={(v) => setForm({ ...form, is_remote: v })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="desc">Description</Label>
              <Textarea id="desc" required rows={8} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe responsibilities, schedule, required experience..." />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Posting..." : "Post job"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
