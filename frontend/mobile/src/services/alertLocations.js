import * as Location from 'expo-location';

const cache = new Map();
const valid = point => Number.isFinite(point.latitude) && Math.abs(point.latitude) <= 90 && Number.isFinite(point.longitude) && Math.abs(point.longitude) <= 180;
async function geocode(name) {
  if (cache.has(name)) return cache.get(name);
  let timer;
  try {
    const result = await Promise.race([Location.geocodeAsync(`${name}, Sri Lanka`), new Promise(resolve => { timer = setTimeout(() => resolve([]), 8000); })]);
    const point = result.find(valid);
    if (point) cache.set(name, point);
    return point;
  } catch { return null; }
  finally { clearTimeout(timer); }
}
export async function resolveAlertLocations(alerts, onUpdate, isActive) {
  const pins = alerts.filter(valid).map(alert => ({ ...alert, _id: `alert:${alert.id}`, isAlert: true, createdAt: alert.publishedAt }));
  onUpdate([...pins]);
  const permission = await Location.requestForegroundPermissionsAsync();
  if (!permission.granted || !isActive()) return;
  const jobs = alerts.flatMap(alert => [...new Set((alert.areas?.length ? alert.areas : [alert.district]).filter(Boolean))].map(area => ({ alert, area })));
  // Two workers avoid overwhelming the device geocoder.
  let index = 0;
  await Promise.all([0, 1].map(async () => {
    while (index < jobs.length && isActive()) {
      const { alert, area } = jobs[index++];
      const point = await geocode(area);
      if (point && isActive()) {
        pins.push({ ...alert, latitude: point.latitude, longitude: point.longitude, _id: `alert:${alert.id}:${area}`, isAlert: true, createdAt: alert.publishedAt, areaLabel: area, locationLabel: `${area} (approximate place location)` });
        onUpdate([...pins]);
      }
    }
  }));
}
