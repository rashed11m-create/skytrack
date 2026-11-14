exports.handler = async function () {
  try {
    const response = await fetch(
      "https://api.adsb.lol/v2/point/25.4052/55.5136/100"
    );

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: "Aircraft data unavailable"
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
      body: JSON.stringify({ error: "Connection failed" })
    };
  }
};
