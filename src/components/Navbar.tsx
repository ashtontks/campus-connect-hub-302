import { Link, useNavigate } from "@tanstack/react-router";
import { Briefcase, LogOut, Bookmark, LayoutDashboard, Plus } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <Briefcase className="h-4 w-4" />
          </span>
          ShiftIn
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/jobs">Browse jobs</Link>
          </Button>

          {user && profile?.role === "student" && (
            <Button asChild variant="ghost" size="sm">
              <Link to="/saved" className="hidden sm:inline-flex items-center gap-1.5">
                <Bookmark className="h-4 w-4" /> Saved
              </Link>
            </Button>
          )}

          {user && profile?.role === "employer" && (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/dashboard" className="hidden sm:inline-flex items-center gap-1.5">
                  <LayoutDashboard className="h-4 w-4" /> Dashboard
                </Link>
              </Button>
              <Button asChild size="sm" className="gap-1.5">
                <Link to="/jobs/new">
                  <Plus className="h-4 w-4" /> Post a job
                </Link>
              </Button>
            </>
          )}

          {user ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                await signOut();
                navigate({ to: "/" });
              }}
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/auth">Sign in</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/auth" search={{ mode: "signup" }}>Get started</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
