import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

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
    console.log("Clerk Webhook received:", payloadString);
    const headerPayload = request.headers;

    // TODO: Verify webhook signature using Svix
    // For now, we'll parse the payload and sync
    // In production, you MUST verify the signature.

    try {
      const { data, type } = JSON.parse(payloadString);

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
