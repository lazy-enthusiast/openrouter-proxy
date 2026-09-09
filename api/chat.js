module.exports = async (req, res) => {
  // 1. 設定跨域 CORS 標頭，允許 TypingMind 呼叫
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  // 2. 處理瀏覽器跨域預檢
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // 3. 健康檢查：在瀏覽器打開此網址時顯示成功訊號
  if (req.method === 'GET') {
    return res.status(200).send('OpenRouter US Proxy is running!');
  }

  // 4. 轉發請求至 OpenRouter 核心對話介面
  try {
    const rawBody = typeof req.body === 'string'
      ? req.body
      : (req.body ? JSON.stringify(req.body) : undefined);

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers['authorization'] || '',
      },
      body: rawBody,
    });

    res.status(response.status);

    // 轉發回應標頭（排除衝突標頭）
    response.headers.forEach((value, key) => {
      const lower = key.toLowerCase();
      if (!['content-encoding', 'content-length', 'transfer-encoding'].includes(lower)) {
        res.setHeader(key, value);
      }
    });

    // 即時串流文字輸出
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
};
