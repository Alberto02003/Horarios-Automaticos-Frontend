export const MONTHS_SHORT = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
export const MONTHS_FULL = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

export const DAYS_SHORT = ["L", "M", "X", "J", "V", "S", "D"];
export const DAYS_HEADER = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];
export const DAYS_HEADER_EN = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
export const DAYS_FULL = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"];

export const GRID_START_HOUR = 6;
export const GRID_HOURS = Array.from({ length: 19 }, (_, i) => i + GRID_START_HOUR); // 06:00 - 00:00

export function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

export function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d;
}

export function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export function formatDateRange(weekStart: Date): string {
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 6);
  if (weekStart.getMonth() === end.getMonth()) {
    return `${weekStart.getDate()} - ${end.getDate()} ${MONTHS_SHORT[end.getMonth()]}, ${end.getFullYear()}`;
  }
  return `${weekStart.getDate()} ${MONTHS_SHORT[weekStart.getMonth()]} - ${end.getDate()} ${MONTHS_SHORT[end.getMonth()]}, ${end.getFullYear()}`;
}

export function timeToMinutes(timeStr: string | null, fallback: number): number {
  if (!timeStr) return fallback;
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}
