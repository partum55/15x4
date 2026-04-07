import './FormField.css'

type FormFieldProps = {
  label: string
  error?: string
  children: React.ReactNode
}

export default function FormField({ label, error, children }: FormFieldProps) {
  return (
    <div className="form-field">
      <label className="form-field__label">{label}</label>
      <div className="form-field__control">{children}</div>
      {error && <p className="form-field__error">{error}</p>}
    </div>
  )
}
