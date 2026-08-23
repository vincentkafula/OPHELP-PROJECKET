import { ReactNode, ChangeEvent } from 'react'

interface FormFieldProps {
  label: string
  error?: string
  required?: boolean
  hint?: string
  children: ReactNode
}

export function FormField({ label, error, required, hint, children }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
      {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
    </div>
  )
}

const inputCls = (error?: string) =>
  `w-full px-3 py-2 text-sm rounded-lg border transition-colors outline-none focus:ring-2 focus:ring-green-500/20 ${error ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white focus:border-green-500'}`

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
}

export function Input({ label, error, hint, required, ...props }: InputProps) {
  return (
    <FormField label={label} error={error} required={required} hint={hint}>
      <input className={inputCls(error)} required={required} {...props} />
    </FormField>
  )
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  error?: string
  hint?: string
  options: { value: string; label: string }[]
  placeholder?: string
}

export function Select({ label, error, hint, required, options, placeholder, ...props }: SelectProps) {
  return (
    <FormField label={label} error={error} required={required} hint={hint}>
      <select className={inputCls(error)} required={required} {...props}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </FormField>
  )
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string
  hint?: string
}

export function Textarea({ label, error, hint, required, ...props }: TextareaProps) {
  return (
    <FormField label={label} error={error} required={required} hint={hint}>
      <textarea className={`${inputCls(error)} resize-none`} rows={3} required={required} {...props} />
    </FormField>
  )
}

export default FormField
