export const money = (value) => `UGX ${Number(value || 0).toLocaleString('en-UG')}`
export const metrics = [
  { label: 'Money outstanding', value: 24650000, detail: '38 active loans', tone: 'default' },
  { label: 'Due today', value: 1200000, detail: '12 payments', tone: 'warning' },
  { label: 'Overdue', value: 3400000, detail: '17 payments', tone: 'danger' },
  { label: 'Collected today', value: 840000, detail: '9 receipts', tone: 'success' },
]
export const borrowers = [
  { id: 'john-kato', name: 'John Kato', phone: '0772 418 650', loan: 'LN-1048', outstanding: 250000, nextDue: '22 Aug 2026', status: 'Overdue', days: 4 },
  { id: 'sarah-namusoke', name: 'Sarah Namusoke', phone: '0751 293 884', loan: 'LN-1056', outstanding: 400000, nextDue: '26 Aug 2026', status: 'Due Today', days: 0 },
  { id: 'peter-ssenyonga', name: 'Peter Ssenyonga', phone: '0704 661 209', loan: 'LN-1061', outstanding: 825000, nextDue: '30 Aug 2026', status: 'On Track', days: 0 },
  { id: 'musa-mugisha', name: 'Musa Mugisha', phone: '0788 120 443', loan: 'LN-1032', outstanding: 0, nextDue: 'Completed', status: 'Completed', days: 0 },
  { id: 'joan-nakato', name: 'Joan Nakato', phone: '0762 908 112', loan: 'LN-1064', outstanding: 2150000, nextDue: '28 Aug 2026', status: 'On Track', days: 0 },
]
export const payments = [
  { amount: 100000, date: '21 Aug 2026', method: 'MTN MoMo', collector: 'Amina N.' },
  { amount: 100000, date: '14 Aug 2026', method: 'Cash', collector: 'Amina N.' },
  { amount: 25000, date: '7 Aug 2026', method: 'Airtel Money', collector: 'David K.' },
]
