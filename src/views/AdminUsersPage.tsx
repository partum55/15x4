'use client'

import { useTranslation } from 'react-i18next'
import AdminLayout from '@/components/admin/AdminLayout'
import AdminTableSkeleton from '@/components/admin/AdminTableSkeleton'
import ReauthModal from '@/components/admin/ReauthModal'
import ConfirmModal from '@/components/ConfirmModal'
import UserFilters from '@/components/admin/UserFilters'
import UserTable from '@/components/admin/UserTable'
import { useAdminUsers } from '@/hooks/admin/useAdminUsers'
import { PAGE_SIZE, buildPaginationState } from '@/lib/admin-pagination'

export default function AdminUsersPage() {
  const { t } = useTranslation()
  const {
    users,
    loadingUsers,
    usersError,
    total,
    page,
    setPage,
    searchQuery,
    setSearchQuery,
    roleFilter,
    setRoleFilter,
    sortBy,
    setSortBy,
    pendingRoleUserIds,
    deletingUserIds,
    reauthContext,
    setReauthContext,
    deleteContext,
    setDeleteContext,
    handleSetRole,
    handleDelete,
    performDelete,
    handleReauth,
    currentUser,
  } = useAdminUsers()

  const pagination = buildPaginationState(total, page, PAGE_SIZE)

  if (!currentUser || currentUser?.profile?.role !== 'admin') {
    return null
  }

  return (
    <AdminLayout title={t('admin.users.title')}>
      {reauthContext && (
        <ReauthModal
          onConfirm={handleReauth}
          onCancel={() => setReauthContext(null)}
          title={t('admin.users.confirmMakeAdmin', { name: reauthContext.name })}
          description={t('admin.users.confirmMakeAdminDescription', { name: reauthContext.name })}
        />
      )}

      {deleteContext && (
        <ConfirmModal
          title={t('admin.users.confirmDelete', { name: deleteContext.name })}
          description={t('admin.users.confirmDeleteDescription', { name: deleteContext.name })}
          onConfirm={() => {
            const id = deleteContext.userId
            setDeleteContext(null)
            void performDelete(id)
          }}
          onCancel={() => setDeleteContext(null)}
        />
      )}

      <UserFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        roleFilter={roleFilter}
        setRoleFilter={setRoleFilter}
        sortBy={sortBy}
        setSortBy={setSortBy}
      />

      {!loadingUsers && (
        <p className="mb-4 text-[clamp(12px,1.1vw,16px)] uppercase text-black/60">
          {t('admin.users.showing', { count: users.length, total })}
        </p>
      )}

      {loadingUsers ? (
        <AdminTableSkeleton cols={5} />
      ) : usersError ? (
        <p className="text-[clamp(14px,1.3vw,20px)] opacity-60">{usersError}</p>
      ) : users.length === 0 ? (
        <p className="text-[clamp(14px,1.3vw,20px)] opacity-60">{t('admin.users.empty')}</p>
      ) : (
        <>
          <UserTable
            users={users}
            currentUserId={currentUser.id}
            pendingRoleUserIds={pendingRoleUserIds}
            deletingUserIds={deletingUserIds}
            onSetRole={handleSetRole}
            onDelete={handleDelete}
          />

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between gap-4 py-8 max-[640px]:flex-col max-[640px]:items-stretch">
              <button
                type="button"
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                disabled={pagination.currentPage === 1}
                className="px-6 py-3 border border-black bg-white text-black text-[clamp(12px,1.1vw,16px)] uppercase hover:bg-black hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {t('admin.pagination.prev')}
              </button>
              <span className="text-center text-[clamp(12px,1.1vw,16px)] uppercase text-black/60">
                {pagination.currentPage} / {pagination.totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage(prev => Math.min(pagination.totalPages, prev + 1))}
                disabled={pagination.currentPage === pagination.totalPages}
                className="px-6 py-3 border border-black bg-white text-black text-[clamp(12px,1.1vw,16px)] uppercase hover:bg-black hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {t('admin.pagination.next')}
              </button>
            </div>
          )}
        </>
      )}
    </AdminLayout>
  )
}
