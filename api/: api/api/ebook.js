// api/ebook.js — Agente IA del eBook
// Recibe el historial de chat y devuelve la respuesta del asistente

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key no configurada' });

  try {
    const { messages, systemPrompt } = req.body;
    if (!messages || !Array.isArray(messages)) return res.status(400).json({ error: 'Mensajes requeridos' });

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 600,
        system: systemPrompt || 'Sos el asistente de @myloenergia Uruguay, experto en autos eléctricos.',
        messages: messages.slice(-10), // máximo 10 mensajes de contexto
      }),
    });

    if (!response.ok) throw new Error('Anthropic error ' + response.status);
    const data = await response.json();
    const text = data.content?.map(b => b.text || '').join('') || '';
    return res.status(200).json({ text });

  } catch (e) {
    console.error('eBook API error:', e);
    return res.status(500).json({ error: 'Error del servidor' });
  }
}
