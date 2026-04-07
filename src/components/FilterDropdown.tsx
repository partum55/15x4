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
    <div className="relative" ref={ref}>
      <button
        className="flex items-center gap-2 bg-transparent border-none font-sans text-[clamp(14px,1.3vw,20px)] text-black cursor-pointer py-2 px-0 hover:opacity-70"
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <span>{displayLabel}</span>
        <ChevronIcon direction={isOpen ? 'up' : 'down'} />
      </button>
      {isOpen && (
        <div className="absolute top-[calc(100%+4px)] left-0 bg-white border border-black min-w-[180px] z-[100] flex flex-col">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`block w-full text-left px-4 py-[10px] border-none bg-transparent font-sans text-[clamp(13px,1.2vw,18px)] text-black cursor-pointer transition-colors duration-150 hover:bg-[rgba(0,0,0,0.05)] ${option.value === value ? 'font-bold' : ''}`}
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
