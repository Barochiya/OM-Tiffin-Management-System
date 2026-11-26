export function validDeliveryPin(pin) {
  return Boolean(pin && typeof pin.latitude === 'number' && Number.isFinite(pin.latitude) && Math.abs(pin.latitude) <= 90 && typeof pin.longitude === 'number' && Number.isFinite(pin.longitude) && Math.abs(pin.longitude) <= 180);
}
export function parseDeliveryCoordinates(input) {
  const raw = String(input || '').trim();
  let candidate = raw;
  if (/^https?:\/\//i.test(raw)) {
    let url;
    try { url = new URL(raw); } catch { return null; }
    if (url.protocol !== 'https:' || url.username || url.password || !['www.google.com','google.com','maps.google.com','maps.app.goo.gl'].includes(url.hostname.toLowerCase())) return null;
    candidate = url.searchParams.get('query') || url.searchParams.get('q') || url.searchParams.get('destination') || '';
    const precise = url.href.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
    const camera = url.pathname.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
    if (precise) candidate = precise[1] + ',' + precise[2];
    else if (!candidate && camera) candidate = camera[1] + ',' + camera[2];
  }
  const match = candidate.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);
  if (!match) return null;
  const pin = {latitude:Number(match[1]),longitude:Number(match[2])};
  return validDeliveryPin(pin) ? pin : null;
}
export const deliveryPinUrl = pin => validDeliveryPin(pin) ? 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(pin.latitude + ',' + pin.longitude) : null;
