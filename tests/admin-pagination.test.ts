import assert from 'node:assert/strict'
import test from 'node:test'
import { PAGE_SIZE, buildPaginationState, getAdminPageItems } from '../src/lib/admin-pagination'

test('uses 20 items per admin page', () => {
  const items = Array.from({ length: 45 }, (_, index) => index + 1)
  const { pagination, visibleItems } = getAdminPageItems(items, 1)

  assert.equal(PAGE_SIZE, 20)
  assert.equal(pagination.pageSize, 20)
  assert.equal(visibleItems.length, 20)
  assert.deepEqual(visibleItems, items.slice(0, 20))
})

test('returns the final partial admin page', () => {
  const items = Array.from({ length: 45 }, (_, index) => index + 1)
  const { pagination, visibleItems } = getAdminPageItems(items, 3)

  assert.equal(pagination.currentPage, 3)
  assert.equal(pagination.totalItems, 45)
  assert.equal(pagination.totalPages, 3)
  assert.deepEqual(visibleItems, items.slice(40, 45))
})

test('handles empty admin data', () => {
  const { pagination, visibleItems } = getAdminPageItems([], 1)

  assert.deepEqual(pagination, {
    currentPage: 1,
    pageSize: 20,
    totalItems: 0,
    totalPages: 0,
  })
  assert.deepEqual(visibleItems, [])
})

test('normalizes invalid admin pages', () => {
  assert.equal(buildPaginationState(45, -3).currentPage, 1)
  assert.equal(buildPaginationState(45, 99).currentPage, 3)
})
