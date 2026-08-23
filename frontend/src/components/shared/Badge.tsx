type BadgeVariant = 'green' | 'red' | 'yellow' | 'blue' | 'gray' | 'orange' | 'purple'

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  green: 'bg-green-100 text-green-800',
  red: 'bg-red-100 text-red-800',
  yellow: 'bg-yellow-100 text-yellow-800',
  blue: 'bg-blue-100 text-blue-800',
  gray: 'bg-gray-100 text-gray-700',
  orange: 'bg-orange-100 text-orange-800',
  purple: 'bg-purple-100 text-purple-800',
}

interface BadgeProps {
  label: string
  variant?: BadgeVariant
  dot?: boolean
  size?: 'sm' | 'md'
}

export function Badge({ label, variant = 'gray', dot = false, size = 'sm' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1 font-medium rounded-full ${size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'} ${VARIANT_CLASSES[variant]}`}>
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {label}
    </span>
  )
}

// ── Status helpers ────────────────────────────────────────────────────────────
export function ShiftStatusBadge({ status }: { status: string }) {
  const map: Record<string, [string, BadgeVariant]> = {
    approved: ['Approved', 'green'],
    completed: ['Completed', 'blue'],
    in_progress: ['In Progress', 'yellow'],
    scheduled: ['Scheduled', 'gray'],
    rejected: ['Rejected', 'red'],
    absent: ['Absent', 'orange'],
  }
  const [label, variant] = map[status] ?? [status, 'gray']
  return <Badge label={label} variant={variant} dot />
}

export function PaymentStatusBadge({ status }: { status: string }) {
  const map: Record<string, [string, BadgeVariant]> = {
    processed: ['Processed', 'green'],
    pending: ['Pending', 'yellow'],
    failed: ['Failed', 'red'],
    reversed: ['Reversed', 'orange'],
  }
  const [label, variant] = map[status] ?? [status, 'gray']
  return <Badge label={label} variant={variant} dot />
}

export function IncidentSeverityBadge({ severity }: { severity: string }) {
  const map: Record<string, [string, BadgeVariant]> = {
    critical: ['Critical', 'red'],
    high: ['High', 'orange'],
    medium: ['Medium', 'yellow'],
    low: ['Low', 'green'],
  }
  const [label, variant] = map[severity] ?? [severity, 'gray']
  return <Badge label={label} variant={variant} dot />
}

export function ProjectStatusBadge({ status }: { status: string }) {
  const map: Record<string, [string, BadgeVariant]> = {
    on_track: ['On Track', 'green'],
    at_risk: ['At Risk', 'yellow'],
    delayed: ['Delayed', 'red'],
    completed: ['Completed', 'blue'],
    planning: ['Planning', 'gray'],
    cancelled: ['Cancelled', 'gray'],
  }
  const [label, variant] = map[status] ?? [status, 'gray']
  return <Badge label={label} variant={variant} dot />
}

export function CardStatusBadge({ status }: { status: string }) {
  const map: Record<string, [string, BadgeVariant]> = {
    active: ['Active', 'green'],
    suspended: ['Suspended', 'red'],
    lost: ['Lost', 'orange'],
    cancelled: ['Cancelled', 'gray'],
  }
  const [label, variant] = map[status] ?? [status, 'gray']
  return <Badge label={label} variant={variant} dot />
}

export default Badge
