'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'

type PasswordInputProps = {
  value: string
  onChange: (value: string) => void
  autoComplete?: string
  placeholder?: string
}

export default function PasswordInput({
  value,
  onChange,
  autoComplete,
  placeholder,
}: PasswordInputProps) {
  const { t } = useTranslation()
  const [isVisible, setIsVisible] = useState(false)

  return (
    <div className="relative">
      <input
        type={isVisible ? 'text' : 'password'}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className="pr-20"
      />
      <button
        type="button"
        aria-pressed={isVisible}
        onClick={() => setIsVisible((current) => !current)}
        className="absolute inset-y-0 right-0 px-3 text-[clamp(12px,1vw,16px)] text-black/70 uppercase cursor-pointer bg-transparent border-none"
      >
        {isVisible ? t('auth.password.hide') : t('auth.password.show')}
      </button>
    </div>
  )
}
