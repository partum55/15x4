'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/context/AuthContext'
import { PAGE_SIZE } from '@/lib/admin-pagination'
import { api } from '@/lib/api'
import type { Event } from '@/lib/api'

export function useAdminEvents() {
  const { i18n } = useTranslation()
  const { user, loading } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [loadingEvents, setLoadingEvents] = useState(true)
  const [eventsError, setUsersError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sortBy, setSortBy] = useState('')
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [approvingEventIds, setApprovingEventIds] = useState<Set<string>>(new Set())
  const [deletingEventIds, setDeletingEventIds] = useState<Set<string>>(new Set())
  const [deleteContext, setDeleteContext] = useState<{ id: string, title: string } | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1)
      setDebouncedSearchQuery(searchQuery.trim())
    }, 300)
    return () => window.clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    setPage(1)
  }, [statusFilter, sortBy])

  const fetchEvents = useCallback(async () => {
    if (loading || !user || user?.profile?.role !== 'admin') return
    
    setLoadingEvents(true)
    setUsersError('')
    try {
      const data = await api.admin.getEvents({
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
        search: debouncedSearchQuery,
        status: statusFilter,
        sort: sortBy,
      })
      
      if (!data.error) {
        setEvents(Array.isArray(data.items) ? data.items : [])
        setTotal(Number(data.total ?? 0))
      } else {
        setUsersError(data.error)
      }
    } catch {
      setUsersError('Could not load events.')
    } finally {
      setLoadingEvents(false)
    }
  }, [loading, user, debouncedSearchQuery, statusFilter, sortBy, page])

  useEffect(() => {
    void fetchEvents()
  }, [fetchEvents, i18n.language])

  const handleApprove = async (eventId: string, isPublic: boolean) => {
    if (approvingEventIds.has(eventId)) return
    
    setApprovingEventIds(prev => {
      const next = new Set(prev)
      next.add(eventId)
      return next
    })
    try {
      const data = await api.admin.updateEventApproval(eventId, isPublic)
      if (data.error) {
        alert(data.error)
        return
      }
      setEvents(prev => prev.map(e => e.id === eventId ? { ...e, isPublic } : e))
    } finally {
      setApprovingEventIds(prev => {
        const next = new Set(prev)
        next.delete(eventId)
        return next
      })
    }
  }

  const handleDeleteRequest = (eventId: string) => {
    const target = events.find(e => e.id === eventId)
    if (target) {
      const selectedLanguage = i18n.language.startsWith('en') ? 'en' : 'uk'
      const title = selectedLanguage === 'en' ? target.titleEn || target.titleUk : target.titleUk || target.titleEn
      setDeleteContext({ id: eventId, title })
    }
  }

  const performDelete = async (eventId: string) => {
    setDeletingEventIds(prev => {
      const next = new Set(prev)
      next.add(eventId)
      return next
    })
    try {
      const data = await api.admin.deleteEvent(eventId)
      if (!data.error) {
        setEvents(prev => prev.filter(e => e.id !== eventId))
        setTotal(prev => Math.max(0, prev - 1))
      } else {
        alert(data.error)
      }
    } finally {
      setDeletingEventIds(prev => {
        const next = new Set(prev)
        next.delete(eventId)
        return next
      })
    }
  }

  return {
    events,
    loadingEvents,
    eventsError,
    total,
    page,
    setPage,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    sortBy,
    setSortBy,
    approvingEventIds,
    deletingEventIds,
    deleteContext,
    setDeleteContext,
    handleApprove,
    handleDeleteRequest,
    performDelete,
    currentUser: user
  }
}
