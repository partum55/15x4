'use client'

import { useTranslation } from 'react-i18next'
import { PROFILE_ROLES, type ProfileRole } from '@/lib/roles'
import type { User } from '@/hooks/admin/useAdminUsers'

interface UserTableProps {
  users: User[]
  currentUserId?: string
  pendingRoleUserIds: Set<string>
  deletingUserIds: Set<string>
  onSetRole: (userId: string, role: ProfileRole) => void
  onDelete: (userId: string) => void
}

export default function UserTable({
  users,
  currentUserId,
  pendingRoleUserIds,
  deletingUserIds,
  onSetRole,
  onDelete,
}: UserTableProps) {
  const { t, i18n } = useTranslation()

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b-2 border-black">
            <th className="text-left p-3 text-[clamp(12px,1.1vw,16px)] uppercase">{t('admin.users.name')}</th>
            <th className="text-left p-3 text-[clamp(12px,1.1vw,16px)] uppercase">{t('admin.users.email')}</th>
            <th className="text-left p-3 text-[clamp(12px,1.1vw,16px)] uppercase">{t('admin.users.role')}</th>
            <th className="text-left p-3 text-[clamp(12px,1.1vw,16px)] uppercase">{t('admin.users.createdAt')}</th>
            <th className="text-right p-3 text-[clamp(12px,1.1vw,16px)] uppercase">{t('admin.users.actions')}</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id} className="border-b border-black/20 hover:bg-black/5">
              <td className="p-3 text-[clamp(13px,1.2vw,18px)]">{u.name}</td>
              <td className="p-3 text-[clamp(13px,1.2vw,18px)]">{u.email}</td>
              <td className="p-3 text-[clamp(13px,1.2vw,18px)]">
                <span className={`px-2 py-1 text-[clamp(11px,1vw,14px)] uppercase tracking-wider font-bold ${
                  u.role === 'admin' ? 'bg-red text-white' :
                  u.role === 'lector' ? 'bg-blue text-white' :
                  'bg-black/10 text-black/60'
                }`}>
                  {u.role}
                </span>
              </td>
              <td className="p-3 text-[clamp(13px,1.2vw,18px)]">
                {new Date(u.createdAt).toLocaleDateString(i18n.language.startsWith('en') ? 'en' : 'uk')}
              </td>
              <td className="p-3 text-right">
                <div className="flex gap-2 justify-end items-center flex-wrap">
                  {u.id !== currentUserId && (
                    <div className="relative">
                      <select
                        value={u.role}
                        disabled={pendingRoleUserIds.has(u.id) || deletingUserIds.has(u.id)}
                        onChange={(e) => onSetRole(u.id, e.target.value as ProfileRole)}
                        className="appearance-none bg-white border border-black/20 px-3 py-1 pr-8 text-[clamp(11px,1vw,14px)] cursor-pointer hover:border-black outline-none disabled:opacity-50"
                      >
                        {PROFILE_ROLES.map(role => (
                          <option key={role} value={role}>{role}</option>
                        ))}
                      </select>
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                        <svg width="8" height="6" viewBox="0 0 8 6" fill="none"><path d="M1 1L4 4L7 1" stroke="black" strokeWidth="1.5"/></svg>
                      </div>
                    </div>
                  )}
                  {u.id !== currentUserId && (
                    <button
                      type="button"
                      onClick={() => onDelete(u.id)}
                      disabled={deletingUserIds.has(u.id) || pendingRoleUserIds.has(u.id)}
                      aria-busy={deletingUserIds.has(u.id)}
                      className="px-3 py-1 bg-red text-white border-none text-[clamp(11px,1vw,14px)] cursor-pointer hover:opacity-80 disabled:cursor-wait disabled:opacity-60 disabled:animate-pulse"
                    >
                      {deletingUserIds.has(u.id) ? `${t('admin.users.delete')}...` : t('admin.users.delete')}
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
