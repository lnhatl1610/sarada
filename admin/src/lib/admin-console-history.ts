const MAX_ENTRIES = 20
const MAX_ENTRY_LENGTH = 900
const MAX_HISTORY_LENGTH = 6000

let entries: string[] = []
let installed = false

function redact(value: string): string {
  return value
    .replace(/(authorization|set-cookie|cookie|password|passwd|token|secret|api[_ -]?key)(\s*[:=]\s*)(?:bearer\s+)?[^\r\n,;]+/gi, '$1$2[redacted]')
    .replace(/([?&](?:access_token|refresh_token|password|token|secret|code)=)[^&\s]+/gi, '$1[redacted]')
}

function printable(value: unknown): string {
  if (value instanceof Error) return `${value.name}: ${value.message}${value.stack ? `\n${value.stack}` : ''}`
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (value === null) return 'null'
  return Object.prototype.toString.call(value)
}

function record(value: string): void {
  const message = redact(value).slice(0, MAX_ENTRY_LENGTH)
  if (message) {
    entries = [...entries, `${new Date().toISOString()} ${message}`].slice(-MAX_ENTRIES)
  }
}

export function installAdminConsoleHistory(): void {
  if (installed || typeof console === 'undefined') return
  installed = true
  const originalError = console.error.bind(console)
  console.error = (...args: unknown[]) => {
    record(args.map(printable).join(' '))
    originalError(...args)
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('error', (event) => {
      const location = event.filename ? ` at ${event.filename}:${event.lineno}:${event.colno}` : ''
      const detail = event.error instanceof Error ? `\n${printable(event.error)}` : ''
      record(`Uncaught error: ${event.message || 'Unknown error'}${location}${detail}`)
    })
    window.addEventListener('unhandledrejection', (event) => {
      record(`Unhandled promise rejection: ${printable(event.reason)}`)
    })
  }
}

export function getRecentAdminConsoleErrors(): string {
  return entries.join('\n').slice(-MAX_HISTORY_LENGTH)
}
