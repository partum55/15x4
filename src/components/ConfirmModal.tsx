'use client'

import { useTranslation } from 'react-i18next'

interface ConfirmModalProps {
  onConfirm: () => void
  onCancel: () => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  isDestructive?: boolean
}

export default function ConfirmModal({
  onConfirm,
  onCancel,
  title,
  description,
  confirmText,
  cancelText,
  isDestructive = true,
}: ConfirmModalProps) {
  const { t } = useTranslation()

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white border border-black w-full max-w-md p-8 animate-in fade-in zoom-in duration-200">
        <h2 className="text-[clamp(20px,2vw,28px)] font-normal uppercase mb-4">
          {title}
        </h2>
        <p className="text-[clamp(13px,1.2vw,18px)] text-black/60 mb-8 whitespace-pre-line">
          {description}
        </p>

        <div className="flex gap-4 flex-wrap">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 min-w-[120px] px-6 py-3 border border-black bg-white text-black uppercase text-[clamp(12px,1.1vw,16px)] hover:bg-black/5"
          >
            {cancelText || t('common.cancel', { defaultValue: 'Скасувати' })}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 min-w-[120px] px-6 py-3 border-none text-white uppercase text-[clamp(12px,1.1vw,16px)] hover:opacity-85 ${
              isDestructive ? 'bg-red' : 'bg-black'
            }`}
          >
            {confirmText || t('common.confirm', { defaultValue: 'Підтвердити' })}
          </button>
        </div>
      </div>
    </div>
  )
}
