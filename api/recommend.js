// api/recommend.js — Vercel Serverless Function
// Esta función hace de proxy entre la app y la API de Anthropic.
// La API key nunca llega al navegador — solo existe en las variables de Vercel.

export default async function handler(req, res) {

  // Solo aceptar POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verificar que la API key esté configurada en Vercel
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key no configurada en Vercel' });
  }

  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt requerido' });
    }

    // Límite de longitud para evitar abusos
    if (prompt.length > 8000) {
      return res.status(400).json({ error: 'Prompt demasiado largo' });
    }

    // Llamada real a Anthropic — desde el servidor, con la API key
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 900,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Anthropic error:', error);
      return res.status(502).json({ error: 'Error en la API de Anthropic' });
    }

    const data = await response.json();

    // Devolver solo el texto de la respuesta — no exponemos metadatos de Anthropic
    const text = data.content?.map(b => b.text || '').join('') || '';
    return res.status(200).json({ text });

  } catch (err) {
    console.error('Error en proxy:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}
