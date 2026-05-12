import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { GraduationCap, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/onboarding")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/auth", search: { mode: "signin" } });
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, onboarded")
      .eq("id", data.session.user.id)
      .maybeSingle();
    if (profile?.onboarded) {
      throw redirect({ to: profile.role === "employer" ? "/jobs/new" : "/jobs" });
    }
  },
  head: () => ({ meta: [{ title: "Welcome — ShiftIn" }] }),
  component: OnboardingPage,
});

function OnboardingPage() {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const [submitting, setSubmitting] = useState<"student" | "employer" | null>(null);

  const choose = async (role: "student" | "employer") => {
    if (!user) return;
    setSubmitting(role);
    const { error } = await supabase
      .from("profiles")
      .update({ role, onboarded: true })
      .eq("id", user.id);
    if (error) {
      setSubmitting(null);
      return toast.error(error.message);
    }
    await refreshProfile();
    toast.success("You're all set!");
    navigate({ to: role === "employer" ? "/jobs/new" : "/jobs" });
  };

  return (
    <div className="container mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl flex-col items-center justify-center px-4 py-12">
      <h1 className="font-display text-3xl md:text-4xl font-bold text-center">Who are you?</h1>
      <p className="mt-3 text-center text-muted-foreground">
        Choose how you'd like to use ShiftIn. You can't change this later.
      </p>

      <div className="mt-10 grid w-full gap-5 sm:grid-cols-2">
        <button
          type="button"
          disabled={!!submitting}
          onClick={() => choose("student")}
          className="group text-left"
        >
          <Card className="h-full p-6 transition-all hover:border-accent hover:shadow-[var(--shadow-elegant)] disabled:opacity-50">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <GraduationCap className="h-7 w-7" aria-hidden />
            </div>
            <h2 className="mt-4 font-display text-xl font-semibold">🎓 I'm a Student</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Looking for part-time work that fits around classes.
            </p>
            <p className="mt-6 text-sm font-medium text-accent">
              {submitting === "student" ? "Setting up..." : "Browse jobs →"}
            </p>
          </Card>
        </button>

        <button
          type="button"
          disabled={!!submitting}
          onClick={() => choose("employer")}
          className="group text-left"
        >
          <Card className="h-full p-6 transition-all hover:border-accent hover:shadow-[var(--shadow-elegant)] disabled:opacity-50">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <Building2 className="h-7 w-7" aria-hidden />
            </div>
            <h2 className="mt-4 font-display text-xl font-semibold">🏢 I'm an Employer</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Looking to hire reliable students for shifts and gigs.
            </p>
            <p className="mt-6 text-sm font-medium text-accent">
              {submitting === "employer" ? "Setting up..." : "Post a job →"}
            </p>
          </Card>
        </button>
      </div>
    </div>
  );
}
