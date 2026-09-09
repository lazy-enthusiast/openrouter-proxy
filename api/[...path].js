export default async function handler(req, res) {
  // 1. 處理瀏覽器跨域預檢請求 (CORS)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // 2. 目標導向 OpenRouter
  const targetUrl = `https://openrouter.ai${req.url}`;

  // 3. 徹底洗淨 IP 標頭：只轉發授權與格式，絕不洩漏香港客戶端 IP
  const forwardHeaders = {
    'Content-Type': req.headers['content-type'] || 'application/json',
    'Authorization': req.headers['authorization'] || '',
  };

  try {
    const body = (req.method === 'GET' || req.method === 'HEAD')
      ? undefined
      : (typeof req.body === 'string' ? req.body : JSON.stringify(req.body));

    // 4. 從美國東部機房發出請求
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: forwardHeaders,
      body,
    });

    res.status(response.status);

    // 5. 轉發回應標頭（排除衝突標頭）
    response.headers.forEach((value, key) => {
      const lower = key.toLowerCase();
      if (!['content-encoding', 'content-length', 'transfer-encoding'].includes(lower)) {
        res.setHeader(key, value);
      }
    });

    // 6. 串流轉發文字
    if (response.body) {
      const reader = response.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
      res.end();
    } else {
      res.end();
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
