const DAY_MS = 24 * 60 * 60 * 1000;

function clampDay(year, month, day) {
  return Math.min(day, new Date(Date.UTC(year, month + 1, 0)).getUTCDate());
}

export function nextOccurrence(task) {
  const frequency = task.recurrence?.frequency;
  if (!frequency || frequency === 'none') return null;
  const base = new Date(task.dueDate || task.occurrenceDate || task.createdAt);
  const interval = Math.max(1, Number(task.recurrence.interval) || 1);
  let next = new Date(base);

  if (frequency === 'daily' || frequency === 'custom') {
    next = new Date(base.getTime() + interval * DAY_MS);
  } else if (frequency === 'weekly') {
    const weekdays = task.recurrence.weekdays?.length ? task.recurrence.weekdays : [base.getUTCDay()];
    const mondayWeek = (date) => {
      const result = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
      result.setUTCDate(result.getUTCDate() - ((result.getUTCDay() + 6) % 7));
      return result;
    };
    const firstWeek = mondayWeek(base).getTime();
    next = null;
    for (let offset = 1; offset <= 7 * interval + 7; offset += 1) {
      const candidate = new Date(base.getTime() + offset * DAY_MS);
      const weekIndex = Math.floor((mondayWeek(candidate).getTime() - firstWeek) / (7 * DAY_MS));
      if (weekIndex % interval === 0 && weekdays.includes(candidate.getUTCDay())) {
        next = candidate;
        break;
      }
    }
    if (!next) return null;
  } else if (frequency === 'monthly') {
    const targetMonth = base.getUTCMonth() + interval;
    const year = base.getUTCFullYear() + Math.floor(targetMonth / 12);
    const month = ((targetMonth % 12) + 12) % 12;
    next = new Date(base);
    next.setUTCFullYear(year, month, clampDay(year, month, base.getUTCDate()));
  } else if (frequency === 'yearly') {
    const year = base.getUTCFullYear() + interval;
    next = new Date(base);
    next.setUTCFullYear(year, base.getUTCMonth(), clampDay(year, base.getUTCMonth(), base.getUTCDate()));
  }

  if (task.recurrence.endDate && next > new Date(task.recurrence.endDate)) return null;
  return next;
}

export function recurrenceForInput(value = {}) {
  const frequency = value.frequency || 'none';
  const interval = Math.min(365, Math.max(1, Number(value.interval) || 1));
  const weekdays = [...new Set((Array.isArray(value.weekdays) ? value.weekdays : []).map(Number))]
    .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6);
  return {
    frequency,
    interval,
    weekdays: frequency === 'weekly' ? weekdays : [],
    endDate: value.endDate ? new Date(value.endDate) : null,
  };
}
