export function getPeriod(date = new Date()) {
  return {
    year: date.getFullYear(),
    month: date.getMonth(),
  };
}

export function periodKey(year: number, month: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

export function dueDateFor(year: number, month: number, dueDay: number) {
  const lastDay = new Date(year, month + 1, 0).getDate();
  const day = Math.min(Math.max(dueDay, 1), lastDay);
  return new Date(year, month, day);
}

export function currentInvoicePeriod(closingDay: number, date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  if (day > closingDay) {
    const next = new Date(year, month + 1, 1);
    return { year: next.getFullYear(), month: next.getMonth() };
  }

  return { year, month };
}
