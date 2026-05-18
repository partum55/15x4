'use client'

import { useTranslation } from 'react-i18next'
import { PROFILE_ROLES } from '@/lib/roles'

interface UserFiltersProps {
  searchQuery: string
  setSearchQuery: (val: string) => void
  roleFilter: string
  setRoleFilter: (val: string) => void
  sortBy: string
  setSortBy: (val: string) => void
}

export default function UserFilters({
  searchQuery,
  setSearchQuery,
  roleFilter,
  setRoleFilter,
  sortBy,
  setSortBy,
}: UserFiltersProps) {
  const { t } = useTranslation()

  return (
    <div className="grid grid-cols-[minmax(220px,1fr)_repeat(2,minmax(150px,220px))] gap-3 mb-8 max-[860px]:grid-cols-2 max-[640px]:grid-cols-1">
      <input
        type="text"
        value={searchQuery}
        onChange={(event) => setSearchQuery(event.target.value)}
        placeholder={t('admin.users.search', { defaultValue: 'пошук за імʼям або поштою' })}
        className="border border-black bg-white px-4 py-3 font-sans text-[clamp(13px,1.2vw,18px)] outline-none"
      />
      <select
        value={roleFilter}
        onChange={(event) => setRoleFilter(event.target.value)}
        className="ui-select"
      >
        <option value="">{t('admin.users.allRoles', { defaultValue: 'усі ролі' })}</option>
        {PROFILE_ROLES.map(role => (
          <option key={role} value={role}>{role}</option>
        ))}
      </select>
      <select
        value={sortBy}
        onChange={(event) => setSortBy(event.target.value)}
        className="ui-select"
      >
        <option value="">{t('admin.users.newest', { defaultValue: 'спочатку новіші' })}</option>
        <option value="oldest">{t('admin.users.oldest', { defaultValue: 'спочатку старіші' })}</option>
        <option value="nameAZ">A-Z</option>
        <option value="nameZA">Z-A</option>
      </select>
    </div>
  )
}
