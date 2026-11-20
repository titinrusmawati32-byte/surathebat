// api/gas.js - Vercel Serverless Edge Function Proxy for Google Apps Script
// Mengatasi batasan CORS dan redirect 302 dari Google Apps Script Web App

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-gas-url'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  let bodyJson = {};
  if (req.method === 'POST') {
    try {
      bodyJson = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    } catch (e) {
      bodyJson = req.body || {};
    }
  }

  // Prioritas pembacaan URL Web App GAS:
  // 1. Environment Variable di Vercel Dashboard (paling aman)
  // 2. Header kustom 'x-gas-url' dari Frontend
  // 3. Properti 'gasUrl' di dalam request body (yang dikirim dari config.js)
  // 4. Query parameter '?gasUrl=...'
  const gasUrl =
    process.env.GAS_WEBAPP_URL ||
    req.headers['x-gas-url'] ||
    bodyJson.gasUrl ||
    req.query.gasUrl;

  if (!gasUrl || gasUrl.includes('GANTI_DENGAN_URL_WEB_APP')) {
    return res.status(400).json({
      success: false,
      message: 'GAS_WEBAPP_URL belum diisi. Masukkan URL Web App di config.js atau di Environment Variables Vercel.'
    });
  }

  try {
    const isPost = req.method === 'POST';
    const response = await fetch(gasUrl, {
      method: isPost ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      body: isPost ? JSON.stringify(bodyJson) : undefined,
      redirect: 'follow'
    });

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Proxy Error ke Google Apps Script: ' + error.message
    });
  }
}
