module.exports = async (req, res) => {
  // 1. 優先回傳跨域 CORS 標頭
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // 2. 組裝目標網址並剔除香港 IP 追蹤
  const targetUrl = 'https://openrouter.ai' + req.url;
  const headers = {
    'Content-Type': req.headers['content-type'] || 'application/json',
    'Authorization': req.headers['authorization'] || '',
  };

  try {
    const rawBody = req.body ? (typeof req.body === 'string' ? req.body : JSON.stringify(req.body)) : undefined;

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: headers,
      body: (req.method === 'GET' || req.method === 'HEAD') ? undefined : rawBody,
    });

    res.status(response.status);

    response.headers.forEach((value, key) => {
      const lower = key.toLowerCase();
      if (!['content-encoding', 'content-length', 'transfer-encoding'].includes(lower)) {
        res.setHeader(key, value);
      }
    });

    const data = await response.arrayBuffer();
    res.send(Buffer.from(data));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
