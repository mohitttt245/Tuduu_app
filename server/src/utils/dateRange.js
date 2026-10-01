export function userDayRange(req) {
  const parsedOffset = Number.parseInt(req.get('x-timezone-offset') || '0', 10);
  const offsetMinutes = Number.isInteger(parsedOffset) ? Math.max(-840, Math.min(840, parsedOffset)) : 0;
  const localNow = new Date(Date.now() - offsetMinutes * 60_000);
  const start = new Date(Date.UTC(localNow.getUTCFullYear(), localNow.getUTCMonth(), localNow.getUTCDate()) + offsetMinutes * 60_000);
  const localTomorrow = new Date(Date.UTC(localNow.getUTCFullYear(), localNow.getUTCMonth(), localNow.getUTCDate() + 1));
  const end = new Date(Date.UTC(localTomorrow.getUTCFullYear(), localTomorrow.getUTCMonth(), localTomorrow.getUTCDate()) + offsetMinutes * 60_000);
  return { start, end };
}
