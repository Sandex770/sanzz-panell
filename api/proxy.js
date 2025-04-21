export default async function handler(req, res) {
  const route = req.query.route;
  const baseUrl = "https://mikudevprivate.pteropanelku.biz.id/api/application";

  if (!route) {
    return res.status(400).json({ error: "Missing 'route' query parameter." });
  }

  const url = `${baseUrl}/${route}`;

  try {
    const response = await fetch(url, {
      method: req.method,
      headers: {
        Authorization: req.headers.authorization || '',
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: req.method !== "GET" ? JSON.stringify(req.body) : undefined
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
}