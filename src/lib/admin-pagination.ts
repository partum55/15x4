export const PAGE_SIZE = 20

export type PaginationState = {
  currentPage: number
  pageSize: number
  totalItems: number
  totalPages: number
}

export function normalizeAdminPage(page: number, totalPages: number) {
  if (!Number.isFinite(page) || page < 1) return 1
  if (totalPages > 0 && page > totalPages) return totalPages
  return Math.floor(page)
}

export function buildPaginationState(totalItems: number, currentPage: number, pageSize = PAGE_SIZE): PaginationState {
  const safeTotalItems = Math.max(0, totalItems)
  const totalPages = Math.ceil(safeTotalItems / pageSize)

  return {
    currentPage: normalizeAdminPage(currentPage, totalPages),
    pageSize,
    totalItems: safeTotalItems,
    totalPages,
  }
}

export function getAdminPageItems<T>(items: T[], currentPage: number, pageSize = PAGE_SIZE) {
  const pagination = buildPaginationState(items.length, currentPage, pageSize)
  const start = (pagination.currentPage - 1) * pagination.pageSize
  const end = start + pagination.pageSize

  return {
    pagination,
    visibleItems: items.slice(start, end),
  }
}
