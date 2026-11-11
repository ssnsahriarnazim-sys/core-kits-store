import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-push-secret",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const expected = Deno.env.get("PUSH_WEBHOOK_SECRET") ?? "";
  if (!expected || req.headers.get("x-push-secret") !== expected) {
    return new Response("Unauthorized", { status: 401, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const order = body.record ?? {};
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const publicKey = Deno.env.get("VAPID_PUBLIC_KEY")!;
    const privateKey = Deno.env.get("VAPID_PRIVATE_KEY")!;
    const subject = Deno.env.get("VAPID_SUBJECT") || "mailto:admin@corekits.store";

    webpush.setVapidDetails(subject, publicKey, privateKey);
    const response = await fetch(
      `${supabaseUrl}/rest/v1/admin_push_subscriptions?select=subscription,user_id`,
      { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } },
    );
    if (!response.ok) throw new Error("Could not load push subscriptions");
    const subscriptions = await response.json();

    const payload = JSON.stringify({
      title: "New CORE KITS Order!",
      body: `Order #${String(order.id ?? "").slice(0, 8).toUpperCase()} · ${order.customer_name || order.name || "New customer"} · ৳${order.total_price ?? order.total ?? "—"}`,
      orderId: order.id,
      url: "/admin",
    });

    const results = await Promise.allSettled(
      subscriptions.map(async (row: { subscription: webpush.PushSubscription; user_id: string }) => {
        try {
          await webpush.sendNotification(row.subscription, payload, { TTL: 60 * 60 * 24 });
        } catch (error) {
          if ((error as { statusCode?: number }).statusCode === 404 ||
              (error as { statusCode?: number }).statusCode === 410) {
            await fetch(`${supabaseUrl}/rest/v1/admin_push_subscriptions?user_id=eq.${row.user_id}`, {
              method: "DELETE",
              headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
            });
            return;
          }
          throw error;
        }
      }),
    );
    const failed = results.filter((r) => r.status === "rejected").length;
    return new Response(JSON.stringify({ sent: results.length - failed, failed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
