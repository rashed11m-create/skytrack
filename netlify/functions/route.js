exports.handler = async function (event) {
  try {
    const callsign = (event.queryStringParameters?.callsign || "")
      .trim()
      .toUpperCase();

    const lat = Number(event.queryStringParameters?.lat) || 0;
    const lng = Number(event.queryStringParameters?.lng) || 0;

    if (!callsign) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing callsign" })
      };
    }

    const response = await fetch(
      "https://api.adsb.lol/api/0/routeset/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
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

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify(data)
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Server error" })
    };
  }
};
