// This is a Supabase Edge Function that sends push notifications for upcoming events
// It runs on a schedule to check for events that start soon

type Event = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  start_date: string;
  notification_sent: boolean | null;
};

type Profile = {
  fcm_token: string | null;
};

interface PushNotificationData {
  eventId: string;
  [key: string]: any;
}

interface PushNotificationPayload {
  to: string;
  notification: {
    title: string;
    body: string;
  };
  data?: PushNotificationData;
  android?: {
    priority: "high" | "normal";
  };
  apns?: {
    payload: {
      aps: {
        contentAvailable: boolean;
      };
    };
  };
}

// CORS headers for the response
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

// This is the cron job that will run every minute to check for events that need notifications
Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const firebaseServerKey = Deno.env.get("FIREBASE_SERVER_KEY");

    if (!supabaseUrl || !supabaseKey || !firebaseServerKey) {
      throw new Error("Missing required environment variables");
    }

    // Create a Supabase client with the Auth context of the function
    const supabaseClient = createClient(supabaseUrl, supabaseKey);

    // Get current time and 15 minutes from now
    const now = new Date();
    const in15Minutes = new Date(now.getTime() + 15 * 60 * 1000);

    // Query for events that start in the next 15 minutes and haven't had notifications sent
    const { data: events, error } = await supabaseClient
      .from("events")
      .select("*")
      .lte("start_date", in15Minutes.toISOString())
      .gte("start_date", now.toISOString())
      .is("notification_sent", null);

    if (error) throw error;

    // Process each event
    for (const event of events as Event[]) {
      try {
        // Get the user's FCM token
        const { data: profile, error: profileError } = await supabaseClient
          .from("profiles")
          .select("fcm_token")
          .eq("id", event.user_id)
          .single();

        if (profileError) throw profileError;
        if (!profile?.fcm_token) continue;

        // Send push notification
        await sendPushNotification({
          token: profile.fcm_token,
          title: `Upcoming: ${event.title}`,
          body: event.description || "Your event is starting soon!",
          data: { eventId: event.id },
        });

        // Mark notification as sent
        const { error: updateError } = await supabaseClient
          .from("events")
          .update({
            notification_sent: true,
            notification_sent_at: new Date().toISOString(),
          })
          .eq("id", event.id);

        if (updateError) throw updateError;
      } catch (err) {
        console.error(`Error processing event ${event.id}:`, err);
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed: events.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// Helper function to send push notifications via Firebase Cloud Messaging
async function sendPushNotification({
  token,
  title,
  body,
  data = {},
}: {
  token: string;
  title: string;
  body: string;
  data: Record<string, any>;
}) {
  const message = {
    to: token,
    notification: {
      title,
      body,
    },
    data,
    android: {
      priority: "high" as const,
    },
    apns: {
      payload: {
        aps: {
          contentAvailable: true,
        },
      },
    },
  };

  const response = await fetch("https://fcm.googleapis.com/fcm/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `key=${Deno.env.get("FIREBASE_SERVER_KEY")}`,
    },
    body: JSON.stringify(message),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to send push notification: ${errorText}`);
  }

  return response.json();
}

// @ts-ignore - Deno types are available in the Supabase Edge Functions environment
// @deno-types="https://deno.land/x/supabase_deno@v1.0.5/mod.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Minimal type declarations for Deno environment
type Deno = {
  env: {
    get(key: string): string | undefined;
  };
  serve(handler: (req: Request) => Promise<Response> | Response): void;
};

declare const Deno: Deno;
