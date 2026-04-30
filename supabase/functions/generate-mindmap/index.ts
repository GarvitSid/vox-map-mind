// Lovable AI–powered mind map generator.
// Takes a raw transcript and returns { title, root, ideas[], tasks[] }.
// Falls back to keyword-based extraction if the model is unavailable.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const STOPWORDS = new Set([
  "the","a","an","and","or","but","if","then","so","of","to","in","on","for","with","at","by","from",
  "is","am","are","was","were","be","been","being","it","its","this","that","these","those",
  "i","you","he","she","we","they","me","him","her","us","them","my","your","our","their",
  "do","does","did","done","have","has","had","will","would","can","could","should","may","might",
  "as","about","into","than","also","very","just","really","like","get","got","up","down","out","over",
  "not","no","yes","ok","okay","because","while","when","what","which","who","how","why","there","here",
]);

function fallback(transcript: string) {
  const text = transcript.trim();
  const sentences = text.split(/(?<=[.!?])\s+|\n+/).map((s) => s.trim()).filter(Boolean);
  const freq = new Map<string, number>();
  for (const w of text.toLowerCase().match(/[a-z][a-z'-]{2,}/g) ?? []) {
    if (STOPWORDS.has(w)) continue;
    freq.set(w, (freq.get(w) ?? 0) + 1);
  }
  const top = [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([w]) => w);
  const title = top.slice(0, 3).map((w) => w[0].toUpperCase() + w.slice(1)).join(" ") || "Voice note";
  const ideas = top.slice(0, 4).map((w) => w[0].toUpperCase() + w.slice(1));
  const tasks = sentences
    .filter((s) => /\b(need to|should|must|todo|remember to|let's|let us|plan to|will|going to)\b/i.test(s))
    .slice(0, 3)
    .map((s) => s.replace(/^[-•\d.\s]+/, "").slice(0, 80));
  return { title, root: title, ideas: ideas.length ? ideas : ["Key idea"], tasks };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Defense in depth: require an Authorization bearer token even though
    // verify_jwt = true is set at the platform level.
    const authHeader = req.headers.get("Authorization") ?? req.headers.get("authorization");
    if (!authHeader?.toLowerCase().startsWith("bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { transcript } = await req.json();
    if (!transcript || typeof transcript !== "string" || transcript.trim().length < 2) {
      return new Response(JSON.stringify({ error: "Empty transcript" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ ...fallback(transcript), degraded: true, reason: "missing_api_key" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = `You convert a spoken voice note into a structured mind map.
Return STRICT JSON only with this shape:
{"title":"3-5 word summary","root":"central topic, max 6 words","ideas":["sub-idea 1","sub-idea 2","sub-idea 3","sub-idea 4"],"tasks":["actionable task 1","actionable task 2"]}
Rules:
- ideas: 2 to 5 short noun phrases (max 6 words) drawn from the transcript.
- tasks: 0 to 4 imperative actions explicitly mentioned or clearly implied.
- Do NOT invent content not present in the transcript.
- No markdown, no commentary — JSON only.

Transcript:
"""${transcript.slice(0, 4000)}"""`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You output only valid JSON. No prose." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!aiRes.ok) {
      console.error("AI gateway error", aiRes.status, await aiRes.text());
      return new Response(JSON.stringify({ ...fallback(transcript), degraded: true, reason: `ai_${aiRes.status}` }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiJson = await aiRes.json();
    const raw: string = aiJson?.choices?.[0]?.message?.content ?? "";
    const cleaned = raw.replace(/```json\s*|\s*```/g, "").trim();
    let parsed: { title?: string; root?: string; ideas?: string[]; tasks?: string[] };
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      const match = cleaned.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : {};
    }

    const out = {
      title: (parsed.title ?? "Voice note").toString().slice(0, 60),
      root: (parsed.root ?? parsed.title ?? "Voice note").toString().slice(0, 60),
      ideas: Array.isArray(parsed.ideas) ? parsed.ideas.filter(Boolean).slice(0, 5).map(String) : [],
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks.filter(Boolean).slice(0, 4).map(String) : [],
    };
    if (out.ideas.length === 0) {
      const fb = fallback(transcript);
      out.ideas = fb.ideas;
      if (out.tasks.length === 0) out.tasks = fb.tasks;
    }

    return new Response(JSON.stringify(out), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-mindmap error", e);
    return new Response(JSON.stringify({ error: "Failed to generate mind map" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});