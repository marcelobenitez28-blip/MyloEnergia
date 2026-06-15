// api/leads.js — Almacena y recupera leads del panel de dealer
// Usa Vercel KV para persistencia real entre dispositivos
// Setup: vercel.com → proyecto → Storage → KV → Connect

let kv = null;

async function getKV() {
  if (kv) return kv;
  try {
    const { kv: vercelKV } = await import('@vercel/kv');
    kv = vercelKV;
    return kv;
  } catch {
    return null; // KV no configurado — fallback silencioso
  }
}

export default async function handler(req, res) {
  // CORS para el frontend
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Dealer-Key');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const store = await getKV();

  // ── POST: guardar lead ──────────────────────────────────
  if (req.method === 'POST') {
    try {
      const lead = req.body;
      if (!lead || !lead.ts) return res.status(400).json({ error: 'Lead inválido' });

      if (store) {
        const leads = await store.get('leads') || [];
        leads.unshift(lead);
        if (leads.length > 1000) leads.splice(1000);
        await store.set('leads', leads);
      }

      return res.status(200).json({ ok: true });
    } catch (e) {
      console.error('Error guardando lead:', e);
      return res.status(200).json({ ok: true }); // no bloquear al usuario si falla
    }
  }

  // ── GET: recuperar leads (requiere contraseña dealer) ──
  if (req.method === 'GET') {
    const key = req.headers['x-dealer-key'];
    const DEALER_PWD = process.env.DEALER_PWD;

    if (!DEALER_PWD || key !== DEALER_PWD) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    try {
      if (store) {
        const leads = await store.get('leads') || [];
        return res.status(200).json({ leads });
      }
      return res.status(200).json({ leads: [], note: 'KV no configurado — leads solo en localStorage' });
    } catch (e) {
      return res.status(500).json({ error: 'Error recuperando leads' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
