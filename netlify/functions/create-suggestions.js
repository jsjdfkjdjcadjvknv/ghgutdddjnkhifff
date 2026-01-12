import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // server-side key
);

export const handler = async (event) => {
  try {
    const { user_id, name, email, topic_id, suggestion } = JSON.parse(event.body || "{}");

    if (!user_id || !name || !email || !topic_id || !suggestion) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing fields" }) };
    }

    const { error } = await supabase.from("suggestions").insert([
      { user_id, name, email, topic_id, suggestion, likes: 0 }
    ]);

    if (error) return { statusCode: 500, body: JSON.stringify({ error: error.message }) };

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
