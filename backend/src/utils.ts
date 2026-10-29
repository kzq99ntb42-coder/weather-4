export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function validateCoords(latitude: string | undefined, longitude: string | undefined) {
  if (latitude === undefined || longitude === undefined) {
    return { ok: false, error: 'Latitude and longitude are required.' };
  }

  const lat = Number(latitude);
  const lon = Number(longitude);

  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    return { ok: false, error: 'Latitude and longitude must be valid numbers.' };
  }

  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return { ok: false, error: 'Latitude and longitude are out of range.' };
  }

  return { ok: true, latitude: lat, longitude: lon };
}

export function toTitleCase(value: string) {
  return value
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
