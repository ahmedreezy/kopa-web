export const money = (value) => `UGX ${Number(value || 0).toLocaleString('en-UG')}`

export const date = (value) => value
  ? new Intl.DateTimeFormat('en-UG', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${String(value).slice(0, 10)}T12:00:00`))
  : '—'

export const dateTime = (value) => value
  ? new Intl.DateTimeFormat('en-UG', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value))
  : '—'
