/**
 * Cloudflare Worker: Notion Webhook → Cloudflare Pages Deploy
 *
 * Receives webhook events from Notion and triggers a Cloudflare Pages deploy.
 * Only triggers on page.content_updated events (new/edited expenses).
 */

export default {
  async fetch(request, env) {
    // Only accept POST requests
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    try {
      const body = await request.json();

      // Step 1: Handle initial verification request from Notion
      // During webhook setup, Notion sends a verification_token to confirm your endpoint
      if (body.verification_token && !body.type) {
        // Log the token - you'll need to copy this to Notion's webhook verification form
        console.log("Verification token received:", body.verification_token);
        // Return 200 to acknowledge receipt (Notion just needs a successful response)
        return new Response(
          JSON.stringify({
            message: "Verification token received. Copy it from the logs.",
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Step 2: Validate payload signature (recommended for production)
      if (env.VERIFICATION_TOKEN) {
        const signature = request.headers.get("X-Notion-Signature");
        if (signature) {
          const isValid = await validateSignature(
            JSON.stringify(body),
            signature,
            env.VERIFICATION_TOKEN
          );
          if (!isValid) {
            return new Response("Invalid signature", { status: 401 });
          }
        }
      }

      // Step 3: Handle webhook events
      const eventType = body.type;

      // Only trigger deploy for content updates (new/edited expenses)
      // You can add more event types as needed
      const triggerEvents = [
        "page.content_updated",
        "page.created",
        "page.properties_updated",
      ];

      if (triggerEvents.includes(eventType)) {
        // Trigger Cloudflare Pages deploy
        if (!env.DEPLOY_HOOK_URL) {
          console.error("DEPLOY_HOOK_URL not configured");
          return new Response("Deploy hook not configured", { status: 500 });
        }

        const deployResponse = await fetch(env.DEPLOY_HOOK_URL, {
          method: "POST",
        });

        if (deployResponse.ok) {
          console.log(`Deploy triggered by ${eventType} event`);
          return new Response(
            JSON.stringify({
              success: true,
              event: eventType,
              message: "Deploy triggered",
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }
          );
        } else {
          console.error("Deploy hook failed:", await deployResponse.text());
          return new Response("Deploy hook failed", { status: 502 });
        }
      }

      // Acknowledge other events without triggering deploy
      return new Response(
        JSON.stringify({
          success: true,
          event: eventType,
          message: "Event received, no deploy needed",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      console.error("Webhook error:", error);
      return new Response("Internal error", { status: 500 });
    }
  },
};

/**
 * Validate Notion webhook signature using HMAC-SHA256
 */
async function validateSignature(body, signature, secret) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(body)
  );

  const hashArray = Array.from(new Uint8Array(signatureBuffer));
  const calculatedSignature =
    "sha256=" + hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

  return calculatedSignature === signature;
}
