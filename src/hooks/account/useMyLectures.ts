'use client'

import { useState, useEffect, useCallback } from 'react'
import { PAGE_SIZE } from '@/lib/admin-pagination'
import { api } from '@/lib/api'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import type { Lecture } from '@/lib/api'

export function useMyLectures() {
  const { user, loading: userLoading } = useCurrentUser()
  const [lectures, setLectures] = useState<Lecture[]>([])
  const [loadingLectures, setLoadingLectures] = useState(true)
  const [deletingLectureIds, setDeletingLectureIds] = useState<Set<string>>(new Set())
  const [deleteContext, setDeleteContext] = useState<{ id: string, title: string } | null>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1)
      setDebouncedSearchQuery(searchQuery.trim())
    }, 300)
    return () => window.clearTimeout(timer)
  }, [searchQuery])

  const fetchMyLectures = useCallback(async () => {
    if (userLoading) return
    if (!user?.id) {
      setLectures([])
      setTotal(0)
      setLoadingLectures(false)
      return
    }

    setLoadingLectures(true)
    try {
      const data = await api.getLecturesPage({ 
        scope: 'mine',
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
        search: debouncedSearchQuery,
        status: statusFilter
      })
      setLectures(data.items || [])
      setTotal(data.total || 0)
    } catch {
      setLectures([])
      setTotal(0)
    } finally {
      setLoadingLectures(false)
    }
  }, [user?.id, userLoading, page, debouncedSearchQuery, statusFilter])

  useEffect(() => {
    void fetchMyLectures()
  }, [fetchMyLectures])

  const handleDeleteRequest = (id: string) => {
    const lecture = lectures.find(l => l.id === id)
    if (lecture) {
      setDeleteContext({ id, title: lecture.titleUk || lecture.titleEn || '' })
    }
  }

  const performDelete = async (id: string) => {
    setDeletingLectureIds(prev => new Set(prev).add(id))
    try {
      await api.deleteLecture(id)
      setLectures(prev => prev.filter(l => l.id !== id))
      setTotal(prev => Math.max(0, prev - 1))
    } catch (err) {
      console.error(err)
    } finally {
      setDeletingLectureIds(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  return {
    lectures,
    loadingLectures,
    total,
    page,
    setPage,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    deletingLectureIds,
    deleteContext,
    setDeleteContext,
    handleDeleteRequest,
    performDelete
  }
}
