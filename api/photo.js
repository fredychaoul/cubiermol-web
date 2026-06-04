// Proxy de fotos Cubiermol: sirve la imagen de Drive desde el mismo dominio
// para que el "Compartir por WhatsApp" pueda hacer fetch() sin bloqueo CORS.
//
// Uso: /api/photo?id=25
// Busca el ID en el mapeo del Apps Script (id -> URL de Drive), descarga la
// imagen del lado del servidor (sin CORS) y la devuelve como bytes.

const MAP_URL = 'https://script.google.com/macros/s/AKfycbznWVPo7TyuUlq7lWLMJlouyaJRIrfnYWy74lor_5QHkjItvMfADg94IoidqAKq4YaNng/exec';

// Cache en memoria del mapeo (se conserva entre invocaciones "calientes")
let mapCache = { data: null, ts: 0 };
const MAP_TTL = 5 * 60 * 1000; // 5 minutos

async function getMap() {
  if (mapCache.data && Date.now() - mapCache.ts < MAP_TTL) return mapCache.data;
  const r = await fetch(MAP_URL, { redirect: 'follow' });
  if (!r.ok) throw new Error('map ' + r.status);
  const data = await r.json();
  mapCache = { data, ts: Date.now() };
  return data;
}

export default async function handler(req, res) {
  const id = String((req.query && req.query.id) || '').replace(/[^0-9]/g, '');
  if (!id) {
    res.status(400).send('missing id');
    return;
  }
  try {
    const map = await getMap();
    const url = map[id];
    if (!url) {
      res.status(404).send('no photo for id ' + id);
      return;
    }
    const img = await fetch(url, { redirect: 'follow' });
    if (!img.ok) {
      res.status(502).send('upstream ' + img.status);
      return;
    }
    const ct = img.headers.get('content-type') || 'image/jpeg';
    const buf = Buffer.from(await img.arrayBuffer());
    res.setHeader('Content-Type', ct);
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).send(buf);
  } catch (e) {
    res.status(500).send('error: ' + (e && e.message ? e.message : 'unknown'));
  }
}
