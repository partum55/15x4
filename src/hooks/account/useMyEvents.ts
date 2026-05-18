'use client'

import { useState, useEffect, useCallback } from 'react'
import { PAGE_SIZE } from '@/lib/admin-pagination'
import { api } from '@/lib/api'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import type { Event } from '@/lib/api'

export function useMyEvents() {
  const { user, loading: userLoading } = useCurrentUser()
  const [events, setEvents] = useState<Event[]>([])
  const [loadingEvents, setLoadingEvents] = useState(true)
  const [deletingEventIds, setDeletingEventIds] = useState<Set<string>>(new Set())
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

  const fetchMyEvents = useCallback(async () => {
    if (userLoading) return
    if (!user?.id) {
      setEvents([])
      setTotal(0)
      setLoadingEvents(false)
      return
    }

    setLoadingEvents(true)
    try {
      const data = await api.getEventsPage({ 
        scope: 'mine',
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
        search: debouncedSearchQuery,
        status: statusFilter
      })
      setEvents(data.items || [])
      setTotal(data.total || 0)
    } catch {
      setEvents([])
      setTotal(0)
    } finally {
      setLoadingEvents(false)
    }
  }, [user?.id, userLoading, page, debouncedSearchQuery, statusFilter])

  useEffect(() => {
    void fetchMyEvents()
  }, [fetchMyEvents])

  const handleDeleteRequest = (id: string) => {
    const event = events.find(e => e.id === id)
    if (event) {
      setDeleteContext({ id, title: event.titleUk || event.titleEn || '' })
    }
  }

  const performDelete = async (id: string) => {
    setDeletingEventIds(prev => new Set(prev).add(id))
    try {
      await api.deleteEvent(id)
      setEvents(prev => prev.filter(e => e.id !== id))
      setTotal(prev => Math.max(0, prev - 1))
    } catch (err) {
      console.error(err)
    } finally {
      setDeletingEventIds(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  return {
    events,
    loadingEvents,
    total,
    page,
    setPage,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    deletingEventIds,
    deleteContext,
    setDeleteContext,
    handleDeleteRequest,
    performDelete
  }
}
