const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const boundary = (year, month = 1) => new Date(Date.UTC(year, month - 1, 1) - 19800000);
function change(current, previous, label) {
  return { percent: previous > 0 ? Math.round((current - previous) / previous * 1000) / 10 : null,
    label, note: previous === 0 ? (current > 0 ? 'No previous baseline' : 'No activity in either period') : '', previous };
}
function periods(query = {}, now = new Date()) {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(now);
  const currentYear = Number(today.slice(0,4));
  const year = query.year && query.year !== 'all' ? Number(query.year) : null;
  const month = query.month && query.month !== 'all' ? Number(query.month) : null;
  if ((year !== null && (!Number.isInteger(year) || year < 2000 || year > currentYear + 1)) ||
      (month !== null && (!year || !Number.isInteger(month) || month < 1 || month > 12))) throw new Error('Choose a valid year and month.');
  const start = year ? boundary(year, month || 1) : null;
  const end = year ? boundary(year + (month ? 0 : 1), month ? month + 1 : 1) : null;
  const previousStart = year ? (month ? boundary(year, month - 1) : boundary(year - 1)) : null;
  const todayStart = new Date(today + 'T00:00:00+05:30');
  return { currentYear, currentMonth:Number(today.slice(5,7)), year, month, chartYear: year || currentYear, start, end, previousStart,
    todayStart, tomorrow: new Date(+todayStart + 86400000), yesterday: new Date(+todayStart - 86400000),
    label: year ? (month ? MONTHS[month-1] + ' ' + year : String(year)) : 'All time',
    comparisonLabel: month ? 'vs previous month' : 'vs previous year' };
}
module.exports = { MONTHS, boundary, change, periods };
