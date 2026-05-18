'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/context/AuthContext'
import { PAGE_SIZE } from '@/lib/admin-pagination'
import { api } from '@/lib/api'
import type { Lecture } from '@/lib/api'

export function useAdminLectures() {
  const { i18n } = useTranslation()
  const { user, loading } = useAuth()
  const [lectures, setLectures] = useState<Lecture[]>([])
  const [loadingLectures, setLoadingLectures] = useState(true)
  const [lecturesError, setLecturesError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sortBy, setSortBy] = useState('')
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [deletingLectureIds, setDeletingLectureIds] = useState<Set<string>>(new Set())
  const [approvingLectureIds, setApprovingLectureIds] = useState<Set<string>>(new Set())
  const [deleteContext, setDeleteContext] = useState<{ id: string, title: string } | null>(null)
  const [publishEventContext, setPublishEventContext] = useState<{ 
    lectureId: string, 
    eventId: string 
  } | null>(null)
  const [unpublishEventContext, setUnpublishEventContext] = useState<{
    eventId: string
  } | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1)
      setDebouncedSearchQuery(searchQuery.trim())
    }, 300)
    return () => window.clearTimeout(timer)
  }, [searchQuery])

  const fetchLectures = useCallback(async () => {
    if (loading || !user || user?.profile?.role !== 'admin') return

    setLoadingLectures(true)
    setLecturesError('')
    try {
      const data = await api.admin.getLectures({
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
        search: debouncedSearchQuery,
        category: categoryFilter,
        status: statusFilter,
        sort: sortBy,
      })
      
      if (!data.error) {
        setLectures(Array.isArray(data.items) ? data.items : [])
        setTotal(Number(data.total ?? 0))
      } else {
        setLecturesError(data.error)
      }
    } catch {
      setLecturesError('Could not load lectures.')
    } finally {
      setLoadingLectures(false)
    }
  }, [loading, user, debouncedSearchQuery, categoryFilter, statusFilter, sortBy, page])

  useEffect(() => {
    void fetchLectures()
  }, [fetchLectures, i18n.language])

  const handleApprove = async (lectureId: string, isPublic: boolean) => {
    if (approvingLectureIds.has(lectureId)) return
    
    setApprovingLectureIds(prev => new Set(prev).add(lectureId))
    try {
      const data = await api.admin.updateLectureApproval(lectureId, isPublic)
      
      if (data.error === 'CANNOT_PUBLISH_LECTURE_WITHOUT_EVENT') {
        const lecture = lectures.find(l => l.id === lectureId)
        if (lecture) {
          setPublishEventContext({ 
            lectureId, 
            eventId: lecture.eventId
          })
        }
        return
      }

      if (data.error) {
        alert(data.error)
        return
      }

      if (!isPublic && data.remainingPublicCount === 0) {
        setUnpublishEventContext({ eventId: data.eventId })
      }

      setLectures(prev => prev.map(l => l.id === lectureId ? { ...l, isPublic } : l))
    } finally {
      setApprovingLectureIds(prev => {
        const next = new Set(prev)
        next.delete(lectureId)
        return next
      })
    }
  }

  const handlePublishEventAndLecture = async () => {
    if (!publishEventContext) return
    const { eventId, lectureId } = publishEventContext
    setPublishEventContext(null)

    setApprovingLectureIds(prev => new Set(prev).add(lectureId))
    try {
      const eventData = await api.admin.updateEventApproval(eventId, true)
      if (eventData.error) {
        alert(eventData.error)
        return
      }
      setLectures(prev => prev.map(l => {
        if (l.eventId === eventId) return { ...l, isPublic: true }
        return l
      }))
    } finally {
      setApprovingLectureIds(prev => {
        const next = new Set(prev)
        next.delete(lectureId)
        return next
      })
    }
  }

  const handleUnpublishEvent = async () => {
    if (!unpublishEventContext) return
    const { eventId } = unpublishEventContext
    setUnpublishEventContext(null)

    try {
      await api.admin.updateEventApproval(eventId, false)
      setLectures(prev => prev.map(l => {
        if (l.eventId === eventId) return { ...l, isPublic: false }
        return l
      }))
    } catch (err) {
      console.error('Failed to unpublish event:', err)
    }
  }

  const handleDeleteRequest = (lectureId: string) => {
    const target = lectures.find(l => l.id === lectureId)
    if (target) setDeleteContext({ id: lectureId, title: target.title })
  }

  const performDelete = async (lectureId: string) => {
    setDeletingLectureIds(prev => new Set(prev).add(lectureId))
    try {
      const data = await api.admin.deleteLecture(lectureId)
      if (!data.error) {
        setLectures(prev => prev.filter(l => l.id !== lectureId))
        setTotal(prev => Math.max(0, prev - 1))
      } else {
        alert(data.error)
      }
    } finally {
      setDeletingLectureIds(prev => {
        const next = new Set(prev)
        next.delete(lectureId)
        return next
      })
    }
  }

  return {
    lectures,
    loadingLectures,
    lecturesError,
    total,
    page,
    setPage,
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
    statusFilter,
    setStatusFilter,
    sortBy,
    setSortBy,
    approvingLectureIds,
    deletingLectureIds,
    deleteContext,
    setDeleteContext,
    publishEventContext,
    setPublishEventContext,
    unpublishEventContext,
    setUnpublishEventContext,
    handleApprove,
    handlePublishEventAndLecture,
    handleUnpublishEvent,
    handleDeleteRequest,
    performDelete,
    currentUser: user
  }
}
