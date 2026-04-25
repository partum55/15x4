'use client'

import './FormField.css'

type FormFieldProps = {
  label: string
  error?: string
  required?: boolean
  children: React.ReactNode
}

export default function FormField({ label, error, required = false, children }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[clamp(13px,1.2vw,18px)] font-normal text-black uppercase tracking-[0.02em]">
        {label}
        {required && <span className="text-red"> *</span>}
      </label>
      <div className="form-field-control">{children}</div>
      {error && <p className="text-[clamp(12px,1vw,16px)] font-normal text-red">{error}</p>}
    </div>
  )
}
