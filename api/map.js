// Devuelve el mapeo {id: urlMiniaturaDrive} a la página, con CORS habilitado.
// La página NO puede leer el Apps Script directo (lo bloquea CORS y redirige a
// googleusercontent). Este endpoint lo lee del lado del servidor y lo reenvía
// con Access-Control-Allow-Origin, para que la galería use las miniaturas de
// Drive DIRECTAS (rápidas) en vez de pasar cada foto por el proxy.

const MAP_URL = 'https://script.google.com/macros/s/AKfycbznWVPo7TyuUlq7lWLMJlouyaJRIrfnYWy74lor_5QHkjItvMfADg94IoidqAKq4YaNng/exec';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    const r = await fetch(MAP_URL, { redirect: 'follow' });
    if (!r.ok) {
      res.status(502).json({});
      return;
    }
    const data = await r.json();
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300');
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({});
  }
}
