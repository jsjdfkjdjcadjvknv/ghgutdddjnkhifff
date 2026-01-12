import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client with anon key (frontend safe)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Helper to log env variables (debugging)
console.log("SUPABASE_URL set:", !!process.env.SUPABASE_URL);
console.log("SUPABASE_ANON_KEY set:", !!process.env.SUPABASE_ANON_KEY);

export const handler = async (event) => {
  try {
    const { action, provider, redirectTo } = JSON.parse(event.body || "{}");

    // ===== LOGIN =====
    if (action === "login" && provider) {
      try {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider,
          options: { redirectTo },
        });

        console.log("OAuth data:", data, "OAuth error:", error);

        if (error) {
          return { statusCode: 400, body: JSON.stringify({ error: error.message }) };
        }

        return { statusCode: 200, body: JSON.stringify({ url: data?.url || null }) };
      } catch (err) {
        console.error("Login failed:", err);
        return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
      }
    }

    // ===== LOGOUT =====
    if (action === "logout") {
      // Logout is frontend-only since Supabase cookies aren't set in serverless
      return { statusCode: 200, body: JSON.stringify({ success: true }) };
    }

    // ===== GET SESSION =====
    if (action === "getSession") {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        return { statusCode: 200, body: JSON.stringify({ user: session?.user || null }) };
      } catch (err) {
        console.error("getSession failed:", err);
        return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
      }
    }

    // ===== INVALID ACTION =====
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid action" }) };
  } catch (err) {
    console.error("Auth handler crashed:", err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
