exports.handler = async function (event) {
  try {
    const params = event.queryStringParameters || {};
    const callsign = (params.callsign || "").trim().toUpperCase();
    const lat = Number(params.lat);
    const lng = Number(params.lng);

    if (!callsign || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid flight details" })
      };
    }

    const response = await fetch(
      "https://api.adsb.lol/api/0/routeset",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planes: [{ callsign, lat, lng }]
        })
      }
    );

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: "Route unavailable" })
      };
    }

    const data = await response.json();
    const flight = Array.isArray(data) ? data[0] : null;

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({
        callsign,
        departure: flight?._airports?.[0] || null,
        arrival: flight?._airports?.[1] || null,
        plausible: flight?.plausible ?? null
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Server error" })
    };
  }
};
