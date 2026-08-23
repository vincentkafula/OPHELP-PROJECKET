import type { Participant, SystemUser, WorkSite, Shift, PartnerShop, Project, OphelpCard, Incident, Equipment, InventoryItem } from './types'

type ValidationResult = { valid: boolean; errors: Record<string, string> }

function required(val: unknown, label: string): string | null {
  if (!val || (typeof val === 'string' && !val.trim())) return `${label} is required`
  return null
}

function minLen(val: string, min: number, label: string): string | null {
  if (val.trim().length < min) return `${label} must be at least ${min} characters`
  return null
}

function isEmail(val: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)
}

function isPhone(val: string): boolean {
  return /^[\d\s+\-()]{8,15}$/.test(val.trim())
}

function isIdNumber(val: string): boolean {
  return /^\d{13}$/.test(val.trim())
}

function collect(...errs: (string | null)[]): Record<string, string> {
  const out: Record<string, string> = {}
  return out
}

function build(pairs: [string, string | null][]): ValidationResult {
  const errors: Record<string, string> = {}
  for (const [field, msg] of pairs) {
    if (msg) errors[field] = msg
  }
  return { valid: Object.keys(errors).length === 0, errors }
}

export const Validate = {
  participant(data: Partial<Participant>): ValidationResult {
    return build([
      ['firstName', required(data.firstName, 'First name') ?? minLen(data.firstName!, 2, 'First name')],
      ['lastName', required(data.lastName, 'Last name') ?? minLen(data.lastName!, 2, 'Last name')],
      ['idNumber', required(data.idNumber, 'ID number') ?? (isIdNumber(data.idNumber!) ? null : 'ID number must be 13 digits')],
      ['phone', required(data.phone, 'Phone') ?? (isPhone(data.phone!) ? null : 'Enter a valid phone number')],
      ['address', required(data.address, 'Address')],
      ['suburb', required(data.suburb, 'Suburb')],
      ['city', required(data.city, 'City')],
      ['emergencyContact', required(data.emergencyContact, 'Emergency contact name')],
      ['emergencyPhone', required(data.emergencyPhone, 'Emergency phone') ?? (isPhone(data.emergencyPhone!) ? null : 'Enter a valid phone number')],
      ['email', data.email && !isEmail(data.email) ? 'Enter a valid email address' : null],
    ])
  },

  systemUser(data: Partial<SystemUser>): ValidationResult {
    return build([
      ['name', required(data.name, 'Name') ?? minLen(data.name!, 2, 'Name')],
      ['email', required(data.email, 'Email') ?? (isEmail(data.email!) ? null : 'Enter a valid email address')],
      ['role', required(data.role, 'Role')],
    ])
  },

  workSite(data: Partial<WorkSite>): ValidationResult {
    return build([
      ['name', required(data.name, 'Site name')],
      ['address', required(data.address, 'Address')],
      ['suburb', required(data.suburb, 'Suburb')],
      ['type', required(data.type, 'Site type')],
      ['startDate', required(data.startDate, 'Start date')],
      ['endDate', required(data.endDate, 'End date')],
      ['budget', data.budget !== undefined && data.budget < 0 ? 'Budget must be positive' : null],
    ])
  },

  shift(data: Partial<Shift>): ValidationResult {
    return build([
      ['participantId', required(data.participantId, 'Participant')],
      ['siteId', required(data.siteId, 'Work site')],
      ['date', required(data.date, 'Date')],
      ['startTime', required(data.startTime, 'Start time')],
      ['endTime', required(data.endTime, 'End time')],
      ['task', required(data.task, 'Task description')],
    ])
  },

  partnerShop(data: Partial<PartnerShop>): ValidationResult {
    return build([
      ['name', required(data.name, 'Shop name')],
      ['address', required(data.address, 'Address')],
      ['ownerName', required(data.ownerName, 'Owner name')],
      ['ownerEmail', required(data.ownerEmail, 'Owner email') ?? (isEmail(data.ownerEmail!) ? null : 'Enter a valid email')],
      ['phone', required(data.phone, 'Phone') ?? (isPhone(data.phone!) ? null : 'Enter a valid phone number')],
      ['category', required(data.category, 'Category')],
      ['contractExpiry', required(data.contractExpiry, 'Contract expiry date')],
    ])
  },

  project(data: Partial<Project>): ValidationResult {
    return build([
      ['name', required(data.name, 'Project name')],
      ['siteId', required(data.siteId, 'Work site')],
      ['managerId', required(data.managerId, 'Project manager')],
      ['deadline', required(data.deadline, 'Deadline')],
      ['startDate', required(data.startDate, 'Start date')],
      ['budget', data.budget !== undefined && data.budget < 0 ? 'Budget must be positive' : null],
    ])
  },

  incident(data: Partial<Incident>): ValidationResult {
    return build([
      ['title', required(data.title, 'Title')],
      ['description', required(data.description, 'Description') ?? minLen(data.description!, 10, 'Description')],
      ['siteId', required(data.siteId, 'Site')],
      ['severity', required(data.severity, 'Severity')],
    ])
  },

  equipment(data: Partial<Equipment>): ValidationResult {
    return build([
      ['name', required(data.name, 'Name')],
      ['serialNumber', required(data.serialNumber, 'Serial number')],
      ['category', required(data.category, 'Category')],
      ['condition', required(data.condition, 'Condition')],
    ])
  },

  inventory(data: Partial<InventoryItem>): ValidationResult {
    return build([
      ['name', required(data.name, 'Name')],
      ['sku', required(data.sku, 'SKU')],
      ['category', required(data.category, 'Category')],
      ['quantity', data.quantity !== undefined && data.quantity < 0 ? 'Quantity cannot be negative' : null],
      ['unitCost', data.unitCost !== undefined && data.unitCost < 0 ? 'Unit cost cannot be negative' : null],
    ])
  },
}
