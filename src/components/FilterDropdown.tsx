'use client'

import { useState, useRef, useEffect } from 'react'
import ChevronIcon from './ChevronIcon'

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
    <div className="ui-dropdown" ref={ref}>
      <button
        className="ui-dropdown-trigger min-w-[180px]"
        data-open={isOpen ? 'true' : 'false'}
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <span>{displayLabel}</span>
        <ChevronIcon direction={isOpen ? 'up' : 'down'} />
      </button>
      {isOpen && (
        <div className="ui-dropdown-menu">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              className="ui-dropdown-option"
              data-selected={option.value === value ? 'true' : 'false'}
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
