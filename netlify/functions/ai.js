exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" })
    };
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error("Missing API key");
    }

    const body = JSON.parse(event.body || "{}");
    const message = String(body.message || "").trim();

    if (!message || message.length > 3000) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid message" })
      };
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
          "x-goog-api-key": apiKey
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
      return {
        statusCode: 502,
        body: JSON.stringify({
          error: data.error?.message || "AI service unavailable"
        })
      };
    }

    const answer =
      data.candidates?.[0]?.content?.parts
        ?.map(part => part.text || "")
        .join("") || "ما قدرت أطلع إجابة، جرّب مرة ثانية.";

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ reply: answer })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "AI connection failed" })
    };
  }
};
