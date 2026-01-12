import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY // use anon key for browser OAuth
);

export const handler = async (event) => {
  try {
    const { action, provider, redirectTo } = JSON.parse(event.body || "{}");

    if (action === "login" && provider) {
      // Generate OAuth URL
      const { data, error } = supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo },
      });

      if (error) throw error;

      // Return the URL so frontend can redirect
      return {
        statusCode: 200,
        body: JSON.stringify({ url: data?.url }),
      };
    }

    // Logout is handled by frontend clearing local storage / cookie
    if (action === "logout") {
      return { statusCode: 200, body: JSON.stringify({ success: true }) };
    }

    // Session check (optional)
    if (action === "getSession") {
      // frontend can check localStorage/session instead
      return { statusCode: 200, body: JSON.stringify({ user: null }) };
    }

    return { statusCode: 400, body: "Invalid action" };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
