'use client'

import Header from '../components/Header'
import UpcomingEvents from '../components/UpcomingEvents'
import PopularLectures from '../components/PopularLectures'
import JoinSection from '../components/JoinSection'
import Footer from '../components/Footer'

export default function HomePage() {
  return (
    <div className="page">
      <Header />
      <UpcomingEvents />
      <PopularLectures />
      <JoinSection />
      <Footer />
    </div>
  )
}
