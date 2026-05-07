import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search, MapPin, DollarSign, Briefcase } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const CATEGORIES = ["Hospitality", "Retail", "Tutoring", "Tech", "Delivery", "Office", "Creative", "Other"] as const;

export const Route = createFileRoute("/jobs/")({
  head: () => ({
    meta: [
      { title: "Browse part-time jobs — ShiftIn" },
      { name: "description", content: "Search part-time jobs by category, location, pay and remote-friendly options." },
    ],
  }),
  component: JobsList,
});

interface Job {
  id: string;
  title: string;
  company: string;
  category: string;
  location: string;
  is_remote: boolean;
  hourly_pay: number | null;
  description: string;
  created_at: string;
}

function JobsList() {
  const [jobs, setJobs] = useState<Job[] | null>(null);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [minPay, setMinPay] = useState("");

  useEffect(() => {
    let active = true;
    const fetchJobs = async () => {
      let query = supabase
        .from("jobs")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false });
      if (category !== "all") query = query.eq("category", category);
      if (remoteOnly) query = query.eq("is_remote", true);
      const min = parseFloat(minPay);
      if (!isNaN(min)) query = query.gte("hourly_pay", min);
      const { data } = await query;
      if (!active) return;
      let result = (data ?? []) as Job[];
      if (q.trim()) {
        const needle = q.toLowerCase();
        result = result.filter(
          (j) =>
            j.title.toLowerCase().includes(needle) ||
            j.company.toLowerCase().includes(needle) ||
            j.location.toLowerCase().includes(needle)
        );
      }
      setJobs(result);
    };

    fetchJobs();

    const channel = supabase
      .channel("jobs-listings")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "jobs" },
        () => fetchJobs()
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [q, category, remoteOnly, minPay]);

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="font-display text-4xl font-bold">Browse jobs</h1>
        <p className="mt-2 text-muted-foreground">Find part-time work that fits your schedule.</p>
      </div>

      {/* Filters */}
      <div className="mb-8 grid gap-3 rounded-2xl border bg-card p-4 shadow-[var(--shadow-card)] sm:grid-cols-2 lg:grid-cols-5">
        <div className="relative lg:col-span-2">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search title, company, location..." className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input type="number" placeholder="Min pay $/hr" value={minPay} onChange={(e) => setMinPay(e.target.value)} />
        <div className="flex items-center justify-between rounded-md border border-input px-3">
          <Label htmlFor="remote" className="cursor-pointer">Remote only</Label>
          <Switch id="remote" checked={remoteOnly} onCheckedChange={setRemoteOnly} />
        </div>
      </div>

      {/* Jobs */}
      {jobs === null ? (
        <div className="grid gap-4">
          {[1,2,3].map((i) => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      ) : jobs.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed py-16 text-center">
          <Briefcase className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 font-medium">No jobs match your filters</p>
          <p className="text-sm text-muted-foreground">Try clearing some filters.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {jobs.map((job) => (
            <Link key={job.id} to="/jobs/$jobId" params={{ jobId: job.id }}>
              <Card className="group p-6 transition-all hover:shadow-[var(--shadow-elegant)] hover:-translate-y-0.5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{job.category}</Badge>
                      {job.is_remote && <Badge className="bg-success text-success-foreground hover:bg-success">Remote</Badge>}
                    </div>
                    <h2 className="mt-2 font-display text-xl font-semibold group-hover:text-accent">{job.title}</h2>
                    <p className="text-sm text-muted-foreground">{job.company}</p>
                    <p className="mt-3 line-clamp-2 text-sm text-foreground/80">{job.description}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2 text-sm">
                    {job.hourly_pay && (
                      <div className="flex items-center gap-1 font-display text-lg font-semibold text-accent">
                        <DollarSign className="h-4 w-4" />{Number(job.hourly_pay).toFixed(0)}<span className="text-xs font-normal text-muted-foreground">/hr</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />{job.location}
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
