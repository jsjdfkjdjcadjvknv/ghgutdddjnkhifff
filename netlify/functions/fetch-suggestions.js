import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const handler = async (event) => {
  try {
    const topic_id = event.queryStringParameters?.topic_id;
    if (!topic_id) return { statusCode: 400, body: "Missing topic_id" };

    const { data, error } = await supabase
      .from("suggestions")
      .select("*")
      .eq("topic_id", topic_id)
      .order("likes", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) return { statusCode: 500, body: error.message };

    return { statusCode: 200, body: JSON.stringify(data) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: err.message };
  }
};
