exports.handler = async function (event) {
  try {
    const params = event.queryStringParameters || {};

    const lat = Math.max(-90, Math.min(90, Number(params.lat) || 25.4052));
    const lon = Math.max(-180, Math.min(180, Number(params.lon) || 55.5136));
    const radius = Math.max(10, Math.min(250, Number(params.radius) || 100));

    const url = `https://api.adsb.lol/v2/point/${lat}/${lon}/${radius}`;
    const response = await fetch(url);

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: "Aircraft data unavailable" })
      };
    }

    const data = await response.json();

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=10"
      },
      body: JSON.stringify(data)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Connection failed" })
    };
  }
};
