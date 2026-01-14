import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function handler(event) {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const { provider, redirectTo } = JSON.parse(event.body || "{}");

    if (!provider) {
      return { statusCode: 400, body: JSON.stringify({ error: "Provider required" }) };
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    });

    if (error) {
      return { statusCode: 400, body: JSON.stringify({ error: error.message }) };
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ url: data.url }),
    };

  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Function crashed" }),
    };
  }
}
