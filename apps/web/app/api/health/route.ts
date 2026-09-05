import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const started = Date.now();
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("languages").select("id").eq("is_active", true).limit(1);
    return Response.json({
      ok: !error,
      service: "coders-arena-web",
      database: !error,
      latencyMs: Date.now() - started,
      timestamp: new Date().toISOString(),
    }, { status: error ? 503 : 200, headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ ok: false, service: "coders-arena-web", database: false }, { status: 503 });
  }
}
