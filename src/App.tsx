import { Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import UpcomingEvents from './components/UpcomingEvents'
import PopularLectures from './components/PopularLectures'
import JoinSection from './components/JoinSection'
import Footer from './components/Footer'
import EventsPage from './pages/EventsPage'
import LecturesPage from './pages/LecturesPage'
import LectureDetailPage from './pages/LectureDetailPage'
import EventDetailPage from './pages/EventDetailPage'
import AboutPage from './pages/AboutPage'

function HomePage() {
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

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/events" element={<EventsPage />} />
      <Route path="/events/:id" element={<EventDetailPage />} />
      <Route path="/lectures" element={<LecturesPage />} />
      <Route path="/lectures/:id" element={<LectureDetailPage />} />
      <Route path="/about-us" element={<AboutPage />} />
    </Routes>
  )
}
