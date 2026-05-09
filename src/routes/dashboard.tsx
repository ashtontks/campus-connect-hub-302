import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Mail, Phone, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/auth" });
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.session.user.id)
      .maybeSingle();
    if (profile?.role !== "employer") throw redirect({ to: "/jobs" });
  },
  head: () => ({ meta: [{ title: "Employer dashboard — ShiftIn" }] }),
  component: Dashboard,
});

interface JobWithApps {
  id: string;
  title: string;
  company: string;
  category: string;
  location: string;
  hourly_pay: number | null;
  created_at: string;
  applications: {
    id: string;
    note: string;
    contact_email: string;
    contact_phone: string | null;
    created_at: string;
    student: { full_name: string | null } | null;
  }[];
}

function Dashboard() {
  const [jobs, setJobs] = useState<JobWithApps[] | null>(null);

  useEffect(() => {
    (async () => {
      const { data: jobsData } = await supabase
        .from("jobs")
        .select("*")
        .order("created_at", { ascending: false });

      const ids = (jobsData ?? []).map((j) => j.id);
      const { data: appsRaw } = ids.length
        ? await supabase
            .from("applications")
            .select("id, job_id, student_id, note, contact_email, contact_phone, created_at")
            .in("job_id", ids)
        : { data: [] as any[] };

      const studentIds = Array.from(new Set((appsRaw ?? []).map((a: any) => a.student_id)));
      const { data: profs } = studentIds.length
        ? await supabase.from("profiles").select("id, full_name").in("id", studentIds)
        : { data: [] as any[] };
      const profMap = new Map((profs ?? []).map((p: any) => [p.id, p]));

      const apps = (appsRaw ?? []).map((a: any) => ({
        ...a,
        student: profMap.get(a.student_id) ?? null,
      }));

      const merged = (jobsData ?? []).map((j: any) => ({
        ...j,
        applications: apps.filter((a: any) => a.job_id === j.id),
      })) as JobWithApps[];
      setJobs(merged);
    })();
  }, []);

  return (
    <div className="container mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold">Your listings</h1>
          <p className="mt-2 text-muted-foreground">Manage your jobs and review applicants.</p>
        </div>
        <Button asChild><Link to="/jobs/new"><Plus className="mr-2 h-4 w-4" />Post a job</Link></Button>
      </div>

      {jobs === null ? (
        <p className="mt-8 text-muted-foreground">Loading...</p>
      ) : jobs.length === 0 ? (
        <Card className="mt-8 border-dashed py-16 text-center">
          <FileText className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 font-medium">No listings yet</p>
          <Button asChild variant="link" className="mt-2 text-accent"><Link to="/jobs/new">Post your first job</Link></Button>
        </Card>
      ) : (
        <div className="mt-8 space-y-6">
          {jobs.map((job) => (
            <Card key={job.id} className="shadow-[var(--shadow-card)]">
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Badge variant="secondary">{job.category}</Badge>
                    <CardTitle className="mt-2 font-display text-xl">
                      <Link to="/jobs/$jobId" params={{ jobId: job.id }} className="hover:text-accent">
                        {job.title}
                      </Link>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">{job.location}{job.hourly_pay ? ` · $${Number(job.hourly_pay).toFixed(0)}/hr` : ""}</p>
                  </div>
                  <Badge variant={job.applications.length ? "default" : "outline"}>
                    {job.applications.length} application{job.applications.length === 1 ? "" : "s"}
                  </Badge>
                </div>
              </CardHeader>
              {job.applications.length > 0 && (
                <CardContent className="space-y-3">
                  {job.applications.map((a) => (
                    <div key={a.id} className="rounded-lg border bg-muted/30 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium">{a.student?.full_name || "Student"}</p>
                        <p className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</p>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-sm text-foreground/90">{a.note}</p>
                      <div className="mt-3 flex flex-wrap gap-4 text-sm">
                        <a href={`mailto:${a.contact_email}`} className="inline-flex items-center gap-1 text-accent hover:underline">
                          <Mail className="h-3.5 w-3.5" />{a.contact_email}
                        </a>
                        {a.contact_phone && (
                          <a href={`tel:${a.contact_phone}`} className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground">
                            <Phone className="h-3.5 w-3.5" />{a.contact_phone}
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
