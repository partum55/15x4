'use client'

type FilterOption = {
  value: string
  label: string
}

type FilterDropdownProps = {
  label: string
  options: FilterOption[]
  value: string
  onChange: (value: string) => void
}

export default function FilterDropdown({ label, options, value, onChange }: FilterDropdownProps) {
  return (
    <div className="ui-dropdown min-w-[180px] max-[767px]:w-full">
      <select
        className="ui-select ui-select--filter"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={label}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}
