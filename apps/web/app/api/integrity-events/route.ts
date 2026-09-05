import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  contestId: z.string().uuid(),
  eventType: z.enum(["visibility_hidden","visibility_visible","fullscreen_exit","fullscreen_enter","window_blur","window_focus"]),
  clientSession: z.string().uuid().optional(),
  metadata: z.record(z.string(), z.unknown()).optional()
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Invalid event" }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase.from("integrity_events").insert({
    contest_id: parsed.data.contestId,
    user_id: user.id,
    event_type: parsed.data.eventType,
    client_session: parsed.data.clientSession ?? null,
    metadata: parsed.data.metadata ?? {}
  });

  if (error) return Response.json({ error: "Could not record event" }, { status: 500 });
  return Response.json({ ok: true });
}
