import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Webhook } from "svix";

const http = httpRouter();

/**
 * HTTP Action to handle Clerk webhooks.
 * This syncs user data from Clerk to Convex.
 */
http.route({
  path: "/clerk-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const payloadString = await request.text();
    const headerPayload = request.headers;

    try {
      const svixId = headerPayload.get("svix-id");
      const svixTimestamp = headerPayload.get("svix-timestamp");
      const svixSignature = headerPayload.get("svix-signature");

      if (!svixId || !svixTimestamp || !svixSignature) {
        return new Response("Missing svix headers", { status: 400 });
      }

      const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
      if (!webhookSecret) {
        console.error("Missing CLERK_WEBHOOK_SECRET env variable");
        return new Response("Server config error", { status: 500 });
      }

      const wh = new Webhook(webhookSecret);
      // verify throws on failure
      const evt = wh.verify(payloadString, {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature,
      }) as any;

      const { data, type } = evt;

      switch (type) {
        case "user.created":
        case "user.updated": {
          const { id, email_addresses, first_name, last_name } = data;
          const email = email_addresses[0]?.email_address;
          const name = first_name ? `${first_name} ${last_name || ""}`.trim() : undefined;

          await ctx.runMutation(internal.users.upsertFromClerk, {
            clerkId: id,
            email,
            name,
          });
          break;
        }
        case "user.deleted": {
          const { id } = data;
          await ctx.runMutation(internal.users.deleteByClerkId, {
            clerkId: id,
          });
          break;
        }
      }

      return new Response(null, { status: 200 });
    } catch (err) {
      console.error("Clerk Webhook Error:", err);
      return new Response("Webhook Error", { status: 400 });
    }
  }),
});

export default http;
