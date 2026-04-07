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
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ConfirmEmailPage from './pages/ConfirmEmailPage'
import WaitApprovalPage from './pages/WaitApprovalPage'
import AccountSettingsPage from './pages/AccountSettingsPage'
import MyLecturesPage from './pages/MyLecturesPage'
import MyEventsPage from './pages/MyEventsPage'
import AddEditLecturePage from './pages/AddEditLecturePage'
import AddEditEventPage from './pages/AddEditEventPage'
import ProtectedRoute from './components/ProtectedRoute'

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

      {/* Auth pages */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/confirm-email" element={<ConfirmEmailPage />} />
      <Route path="/wait-approval" element={<WaitApprovalPage />} />

      {/* Protected account pages */}
      <Route element={<ProtectedRoute />}>
        <Route path="/account/settings" element={<AccountSettingsPage />} />
        <Route path="/account/lectures" element={<MyLecturesPage />} />
        <Route path="/account/lectures/new" element={<AddEditLecturePage />} />
        <Route path="/account/lectures/:id/edit" element={<AddEditLecturePage />} />
        <Route path="/account/events" element={<MyEventsPage />} />
        <Route path="/account/events/new" element={<AddEditEventPage />} />
        <Route path="/account/events/:id/edit" element={<AddEditEventPage />} />
      </Route>
    </Routes>
  )
}
