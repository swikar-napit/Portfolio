// Vercel serverless function. Keeps the Groq API key on the server.
// Env vars (Vercel > Settings > Environment Variables): GROQ_API_KEY (required), GROQ_MODEL, ALLOWED_ORIGINS (optional, comma-separated)
const { SYSTEM_PROMPT } = require("./_profile");

const ALLOWED = [
  "https://swikarnapit.com.np",
  "https://www.swikarnapit.com.np",
  "http://localhost:5500",
  "http://127.0.0.1:5500",
  ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(",").map(s => s.trim()) : [])
];

// Best-effort rate limit per IP (resets when the function instance recycles)
const hits = new Map();
function limited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter(t => now - t < 60000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 12;
}

module.exports = async (req, res) => {
  const origin = req.headers.origin || "";
  if (ALLOWED.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!ALLOWED.includes(origin)) return res.status(403).json({ error: "Forbidden" });

  const ip = (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";
  if (limited(ip)) return res.status(429).json({ error: "Too many requests" });

  const incoming = Array.isArray(req.body?.messages) ? req.body.messages : [];
  const messages = incoming
    .filter(m => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-10)
    .map(m => ({ role: m.role, content: m.content.slice(0, 1500) }));
  if (!messages.length || messages[messages.length - 1].role !== "user") {
    return res.status(400).json({ error: "Invalid messages" });
  }

  const model = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
  const body = {
    model,
    messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
    temperature: 0.5,
    max_completion_tokens: 900
  };
  if (model.includes("gpt-oss")) body.reasoning_effort = "low";

  try {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      body: JSON.stringify(body)
    });
    if (!r.ok) {
      console.error("Groq error", r.status, await r.text());
      return res.status(502).json({ error: "Upstream error" });
    }
    const data = await r.json();
    const reply = data.choices?.[0]?.message?.content?.trim();
    if (!reply) return res.status(502).json({ error: "Empty reply" });
    return res.status(200).json({ reply });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
};