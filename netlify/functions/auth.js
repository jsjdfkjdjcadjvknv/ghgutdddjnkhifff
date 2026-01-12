import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

console.log("DEBUG: SUPABASE_URL set:", !!process.env.SUPABASE_URL);
console.log("DEBUG: SUPABASE_ANON_KEY set:", !!process.env.SUPABASE_ANON_KEY);

export const handler = async (event) => {
  try {
    console.log("DEBUG: Event body received:", event.body);

    const { action, provider, redirectTo } = JSON.parse(event.body || "{}");

    if (!action) return { statusCode: 400, body: JSON.stringify({ error: "No action" }) };

    if (action === "login") {
      if (!provider) return { statusCode: 400, body: JSON.stringify({ error: "No provider" }) };
      const { data, error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo } });
      console.log("DEBUG: OAuth result:", data, error);
      if (error) return { statusCode: 400, body: JSON.stringify({ error: error.message }) };
      return { statusCode: 200, body: JSON.stringify({ url: data?.url || null }) };
    }

    if (action === "logout") {
      console.log("DEBUG: Logout requested");
      return { statusCode: 200, body: JSON.stringify({ success: true }) };
    }

    if (action === "getSession") {
      const { data: { session }, error } = await supabase.auth.getSession();
      console.log("DEBUG: Session data:", session, error);
      if (error) return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
      return { statusCode: 200, body: JSON.stringify({ user: session?.user || null }) };
    }

    return { statusCode: 400, body: JSON.stringify({ error: "Invalid action" }) };
  } catch (err) {
    console.error("DEBUG: Auth handler crashed:", err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
