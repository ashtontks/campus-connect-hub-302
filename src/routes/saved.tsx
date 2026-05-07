import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bookmark, MapPin, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/saved")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/auth" });
  },
  head: () => ({ meta: [{ title: "Saved jobs — ShiftIn" }] }),
  component: SavedPage,
});

function SavedPage() {
  const [items, setItems] = useState<any[] | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("saved_jobs")
        .select("id, job:jobs(*)")
        .order("created_at", { ascending: false });
      setItems(data ?? []);
    })();
  }, []);

  return (
    <div className="container mx-auto max-w-4xl px-4 py-10">
      <h1 className="font-display text-4xl font-bold">Saved jobs</h1>
      <p className="mt-2 text-muted-foreground">Listings you've bookmarked.</p>

      {items === null ? (
        <p className="mt-8 text-muted-foreground">Loading...</p>
      ) : items.length === 0 ? (
        <Card className="mt-8 border-dashed py-16 text-center">
          <Bookmark className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 font-medium">No saved jobs yet</p>
          <Button asChild variant="link" className="mt-2 text-accent"><Link to="/jobs">Browse jobs</Link></Button>
        </Card>
      ) : (
        <div className="mt-8 grid gap-4">
          {items.filter((i) => i.job).map((i) => (
            <Link key={i.id} to="/jobs/$jobId" params={{ jobId: i.job.id }}>
              <Card className="p-6 transition-all hover:shadow-[var(--shadow-elegant)]">
                <div className="flex flex-wrap justify-between gap-4">
                  <div>
                    <Badge variant="secondary">{i.job.category}</Badge>
                    <h2 className="mt-2 font-display text-xl font-semibold">{i.job.title}</h2>
                    <p className="text-sm text-muted-foreground">{i.job.company}</p>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    {i.job.hourly_pay && <div className="font-display text-lg font-semibold text-accent flex items-center justify-end"><DollarSign className="h-4 w-4" />{Number(i.job.hourly_pay).toFixed(0)}/hr</div>}
                    <div className="flex items-center justify-end gap-1 mt-1"><MapPin className="h-3.5 w-3.5" />{i.job.location}</div>
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
