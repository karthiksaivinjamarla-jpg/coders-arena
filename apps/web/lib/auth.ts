import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requireUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) redirect("/login");
  return { supabase, userId: data.claims.sub as string };
}

export async function requireAdmin() {
  const { supabase, userId } = await requireUser();
  const { data: profile } = await supabase.from("profiles").select("id,full_name,email,role").eq("id", userId).maybeSingle();
  if (!profile || !["admin", "super_admin"].includes(profile.role)) redirect("/dashboard");
  return { supabase, userId, profile };
}
