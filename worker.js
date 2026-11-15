const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8"
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: JSON_HEADERS
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // SKYTRACK AI
    if (path === "/.netlify/functions/ai") {
      if (request.method !== "POST") {
        return json({ error: "Method not allowed" }, 405);
      }

      try {
        if (!env.GEMINI_API_KEY) {
          return json({ error: "AI key is not configured" }, 500);
        }

        const body = await request.json();
        const message = String(body.message || "").trim();

        if (!message || message.length > 3000) {
          return json({ error: "Invalid message" }, 400);
        }

        const history = Array.isArray(body.history)
          ? body.history.slice(-10).map(item => ({
              role: item.role === "model" ? "model" : "user",
              parts: [{
                text: String(item.text || "").slice(0, 2000)
              }]
            })).filter(item => item.parts[0].text)
          : [];

        const response = await fetch(
          "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": env.GEMINI_API_KEY
            },
            body: JSON.stringify({
              system_instruction: {
                parts: [{
                  text: "You are SKYTRACK AI, a friendly aviation assistant for SKYTRACK UAE. Answer in the user's language, Arabic or English. Explain aviation clearly. Never invent live flight data, routes, or airport information. You only know live aircraft information if it is explicitly provided in the conversation."
                }]
              },
              contents: [
                ...history,
                {
                  role: "user",
                  parts: [{ text: message }]
                }
              ]
            })
          }
        );

        const data = await response.json();

        if (!response.ok) {
          return json({
            error: data.error?.message || "AI service unavailable"
          }, 502);
        }

        const reply = data.candidates?.[0]?.content?.parts
          ?.map(part => part.text || "")
          .join("") || "ما قدرت أطلع إجابة، جرّب مرة ثانية.";

        return json({ reply });

      } catch (error) {
        return json({ error: "AI connection failed" }, 500);
      }
    }

    // LIVE AIRCRAFT DATA
    if (path === "/.netlify/functions/aircraft") {
      if (request.method !== "GET") {
        return json({ error: "Method not allowed" }, 405);
      }

      try {
        const lat = Number(url.searchParams.get("lat"));
        const lon = Number(url.searchParams.get("lon"));
        const radius = Math.min(
          250,
          Math.max(1, Number(url.searchParams.get("radius")) || 250)
        );

        if (
          !Number.isFinite(lat) ||
          !Number.isFinite(lon) ||
          Math.abs(lat) > 90 ||
          Math.abs(lon) > 180
        ) {
          return json({ error: "Invalid coordinates" }, 400);
        }

        const upstream = await fetch(
          `https://api.adsb.lol/v2/lat/${lat}/lon/${lon}/dist/${radius}`
        );

        const data = await upstream.json();

        return json(data, upstream.ok ? 200 : upstream.status);

      } catch (error) {
        return json({ error: "Aircraft service unavailable" }, 502);
      }
    }

    // SERVE THE EXISTING WEBSITE
    return env.ASSETS.fetch(request);
  }
};
