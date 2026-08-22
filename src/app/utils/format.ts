const faNum = new Intl.NumberFormat('fa-IR');
const faDate = new Intl.DateTimeFormat('fa-IR', { weekday: 'long', day: 'numeric', month: 'long' });
const faShortDate = new Intl.DateTimeFormat('fa-IR', { day: 'numeric', month: 'short' });
const faTime = new Intl.DateTimeFormat('fa-IR', { hour: '2-digit', minute: '2-digit' });

/** ۱٬۲۵۰٬۰۰۰ */
export function formatPrice(toman: number): string {
  return faNum.format(toman);
}

/** پنجشنبه ۳۱ مرداد */
export function formatDate(iso: string): string {
  return faDate.format(new Date(iso));
}

/** ۳۱ مرداد */
export function formatShortDate(iso: string): string {
  return faShortDate.format(new Date(iso));
}

/** ۰۸:۳۰ */
export function formatTime(iso: string): string {
  return faTime.format(new Date(iso));
}

/** ۱ ساعت و ۳۵ دقیقه */
export function formatDuration(departure: string, arrival: string): string {
  const mins = Math.round((new Date(arrival).getTime() - new Date(departure).getTime()) / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${faNum.format(m)} دقیقه`;
  if (m === 0) return `${faNum.format(h)} ساعت`;
  return `${faNum.format(h)} ساعت و ${faNum.format(m)} دقیقه`;
}

/** ۲ مسافر */
export function formatPassengers(n: number): string {
  return n === 1 ? '۱ مسافر' : `${faNum.format(n)} مسافر`;
}
