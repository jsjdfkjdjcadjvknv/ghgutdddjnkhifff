import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const handler = async (event) => {
  try {
    const { id } = JSON.parse(event.body || "{}");
    if (!id) return { statusCode: 400, body: "Missing id" };

    await supabase.from("suggestions").delete().eq("id", id);

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: err.message };
  }
};
