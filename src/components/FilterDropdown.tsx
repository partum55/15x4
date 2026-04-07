import { useState, useRef, useEffect } from 'react'
import ChevronIcon from './ChevronIcon'
import './FilterDropdown.css'

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
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedOption = options.find((o) => o.value === value)
  const displayLabel = value ? selectedOption?.label || label : label

  return (
    <div className="filter-dropdown" ref={ref}>
      <button
        className="filter-dropdown__trigger"
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <span>{displayLabel}</span>
        <ChevronIcon direction={isOpen ? 'up' : 'down'} />
      </button>
      {isOpen && (
        <div className="filter-dropdown__menu">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`filter-dropdown__option${option.value === value ? ' filter-dropdown__option--active' : ''}`}
              onClick={() => {
                onChange(option.value)
                setIsOpen(false)
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
