import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const handler = async (event) => {
  try {
    const { action, provider, redirectTo } = JSON.parse(event.body || "{}");

    if (action === "login" && provider) {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo },
      });

      if (error) throw error;

      return {
        statusCode: 200,
        body: JSON.stringify({ url: data.url }),
      };
    }

    if (action === "logout") {
      await supabase.auth.signOut();
      return { statusCode: 200, body: JSON.stringify({ success: true }) };
    }

    return { statusCode: 400, body: "Invalid action" };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
