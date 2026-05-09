import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles, Search, Briefcase, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ShiftIn — Part-time jobs that fit your schedule" },
      { name: "description", content: "Discover flexible part-time work for students. Employers post jobs, students apply in seconds." },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 -z-10 opacity-90"
          style={{ background: "var(--gradient-hero)" }}
        />
        <div className="absolute inset-0 -z-10 opacity-30 mix-blend-overlay"
          style={{ backgroundImage: "radial-gradient(circle at 20% 20%, white 0px, transparent 1px), radial-gradient(circle at 80% 60%, white 0px, transparent 1px)", backgroundSize: "40px 40px" }} />

        <div className="container mx-auto px-4 py-24 sm:py-32 lg:py-40">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" /> Built for students, loved by employers
            </div>
            <h1 className="mt-6 font-display text-5xl font-bold leading-[1.05] text-white sm:text-6xl lg:text-7xl">
              Part-time work<br />
              <span className="text-accent">that fits your week.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-white/80">
              Browse flexible roles around campus, hospitality, tutoring, retail and remote gigs. Apply in under a minute.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Link to="/jobs">
                  <Search className="mr-2 h-4 w-4" /> Browse jobs
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white">
                <Link to="/auth" search={{ mode: "signup" }}>
                  Post a job <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            {/* Stats bar */}
            <dl className="mt-12 grid max-w-2xl grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { value: "500+", label: "Job listings" },
                { value: "Free", label: "To apply" },
                { value: "200+", label: "Employers" },
                { value: "48h", label: "Avg response" },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
                  <dt className="font-display text-2xl font-bold text-white">{s.value}</dt>
                  <dd className="text-xs uppercase tracking-wide text-white/70">{s.label}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid gap-8 md:grid-cols-2">
          <div className="rounded-2xl border bg-card p-8 shadow-[var(--shadow-card)]">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/15 text-accent">
              <GraduationCap className="h-6 w-6" />
            </div>
            <h2 className="mt-5 font-display text-2xl font-semibold">For students</h2>
            <p className="mt-2 text-muted-foreground">
              Filter by category, location, pay and remote-friendly. Bookmark jobs and apply with a quick note.
            </p>
            <Button asChild variant="link" className="mt-4 p-0 text-accent">
              <Link to="/jobs">Find a job <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
          <div className="rounded-2xl border bg-card p-8 shadow-[var(--shadow-card)]">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Briefcase className="h-6 w-6" />
            </div>
            <h2 className="mt-5 font-display text-2xl font-semibold">For employers</h2>
            <p className="mt-2 text-muted-foreground">
              Post a listing in minutes. See incoming applications in your dashboard with student notes and contact info.
            </p>
            <Button asChild variant="link" className="mt-4 p-0 text-accent">
              <Link to="/auth" search={{ mode: "signup" }}>Start hiring <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
