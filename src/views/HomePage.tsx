'use client'

import { useEffect, useState } from 'react'
import { Skeleton } from 'boneyard-js/react'
import Header from '../components/Header'
import UpcomingEvents from '../components/UpcomingEvents'
import PopularLectures from '../components/PopularLectures'
import JoinSection from '../components/JoinSection'
import Footer from '../components/Footer'

export default function HomePage() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      setLoading(false)
    }, 220)

    return () => {
      window.clearTimeout(timerId)
    }
  }, [])

  return (
    <Skeleton name="page-home" loading={loading}>
      <div className="page">
        <Header />
        <UpcomingEvents />
        <PopularLectures />
        <JoinSection />
        <Footer />
      </div>
    </Skeleton>
  )
}
