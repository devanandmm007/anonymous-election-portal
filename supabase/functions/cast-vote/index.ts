import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { name, email, phone, nominee_id } = await req.json();

    // Validate input
    if (!name || typeof name !== "string" || name.trim().length === 0 || name.length > 100) {
      return new Response(JSON.stringify({ error: "Valid name is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email) || email.length > 255) {
      return new Response(JSON.stringify({ error: "Valid email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!nominee_id) {
      return new Response(JSON.stringify({ error: "Nominee selection is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get IP from request headers
    const ip_address =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("cf-connecting-ip") ||
      "unknown";

    // Check if election is closed
    const { data: settings } = await supabase
      .from("election_settings")
      .select("*")
      .single();

    if (settings?.is_closed) {
      return new Response(JSON.stringify({ error: "Voting has been closed" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get total votes
    const { count: totalVotes } = await supabase
      .from("voters")
      .select("*", { count: "exact", head: true });

    if ((totalVotes || 0) >= (settings?.max_votes || 60)) {
      // Auto-close
      await supabase
        .from("election_settings")
        .update({ is_closed: true })
        .eq("id", settings.id);

      return new Response(
        JSON.stringify({ error: "Maximum votes reached. Voting is closed." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check duplicate by email
    const { data: existingEmail } = await supabase
      .from("voters")
      .select("id")
      .eq("email", email.toLowerCase().trim())
      .maybeSingle();

    if (existingEmail) {
      return new Response(
        JSON.stringify({ error: "This email has already been used to vote" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check duplicate by IP
    const { data: existingIP } = await supabase
      .from("voters")
      .select("id")
      .eq("ip_address", ip_address)
      .maybeSingle();

    if (existingIP) {
      return new Response(
        JSON.stringify({ error: "A vote has already been cast from this device" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Verify nominee exists
    const { data: nominee } = await supabase
      .from("nominees")
      .select("id")
      .eq("id", nominee_id)
      .maybeSingle();

    if (!nominee) {
      return new Response(JSON.stringify({ error: "Invalid nominee" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Insert voter record
    const { error: insertError } = await supabase.from("voters").insert({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone?.trim() || null,
      ip_address,
      candidate_selected: nominee_id,
    });

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to record vote. Please try again." }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Increment nominee vote count
    const { error: updateError } = await supabase.rpc("increment_vote_count", {
      nominee_uuid: nominee_id,
    });

    if (updateError) {
      // Fallback: direct update
      await supabase
        .from("nominees")
        .update({
          vote_count: (
            await supabase
              .from("voters")
              .select("*", { count: "exact", head: true })
              .eq("candidate_selected", nominee_id)
          ).count || 0,
        })
        .eq("id", nominee_id);
    }

    // Check if we've now reached the limit
    const { count: newTotal } = await supabase
      .from("voters")
      .select("*", { count: "exact", head: true });

    if ((newTotal || 0) >= (settings?.max_votes || 60)) {
      await supabase
        .from("election_settings")
        .update({ is_closed: true })
        .eq("id", settings.id);
    }

    return new Response(
      JSON.stringify({ success: true, message: "Your vote has been recorded successfully" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
