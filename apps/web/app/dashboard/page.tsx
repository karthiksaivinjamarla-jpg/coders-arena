import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/sign-out-button";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub as string | undefined;
  const { data: user } = userId ? await supabase.from("profiles").select("email,full_name,role").eq("id", userId).maybeSingle() : { data: null };

  return (
    <main className="container">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:16}}>
        <div>
          <h1>Dashboard</h1>
          <p className="muted">{user?.email ?? "Not signed in"}</p>
        </div>
        <SignOutButton />
      </div>
      <div className="grid grid-3" style={{marginTop:20}}>
        <div className="card"><b>Upcoming contests</b><p className="muted">Contest discovery will appear here.</p></div>
        <div className="card"><b>Submissions</b><p className="muted">Your judging history will appear here.</p></div>
        <div className="card"><b>Profile</b><p className="muted">Complete your participant profile.</p></div>
      </div>
    </main>
  );
}
