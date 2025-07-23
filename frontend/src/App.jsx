import React from 'react'
import { useLocation, Navigate, Routes, Route } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
// import RequireAuth from '@auth-kit/react-router/RequireAuth'
import useIsAuthenticated from 'react-auth-kit/hooks/useIsAuthenticated'
import RestoreAccountPage from './pages/RestoreAccountPage';
import Layout from './Layout'
import Homepage from './pages/Homepage'
import LoginPage from './pages/LoginPage'
import About from './pages/About'
import ContactPage from './pages/ContactPage'
import BlogsPage from './pages/BlogsPage'
import BlogPostPage from './pages/BlogPostPage'
import DashboardLayout from './components/dashboard/DashboardLayout'
import DashboardHome from './pages/DashboardHome'
import MyPlaylists from './pages/MyPlaylists'
import CategoryView from './pages/CategoryView'
import PlaylistView from './pages/PlaylistView'
import UserPlaylistView from './pages/UserPlaylistView';
import SongView from './pages/SongView'
import Search from './pages/Search'
import ProfilePage from './pages/ProfilePage'
import TransitionWrapper from './components/custom-ui/transition'
import SubscribePage from './pages/SubscribePage'
import PaymentSuccesful from './components/landing/PaymentSuccesful'

import AdminRoute from './components/admin/AdminRoutes'
import AdminDashboardLayout from './components/admin/AdminDashboardLayout'
import AdminUsersOverview from './pages/Admin/AdminUsersOverview';
import AdminUserDetailPage from './pages/Admin/AdminUserDetailPage';
import AdminLoginPage from './pages/Admin/AdminLoginPage'
import AdminCategoriesOverview from './pages/Admin/AdminCategoriesOverview'
import AdminCategoryDetail from './pages/Admin/AdminCategoryDetail'
import AdminPlaylistsOverview from './pages/Admin/AdminPlaylistOverview'
import AdminPlaylistDetail from './pages/Admin/AdminPlaylistDetail'
import AdminSongsOverview from './pages/Admin/AdminSongsOverview'
import AdminSongDetail from './pages/Admin/AdminSongDetail'
import AdminUpload from './pages/Admin/AdminR2FileManager'
import AdminAdminsOverview from './pages/Admin/AdminAdminsOverview'
import RecentlyPlayed from './pages/RecentlyPlayed'


// Wrap with your page‑transition HOC
const WrappedHomepage = TransitionWrapper(Homepage)
const WrappedLoginPage = TransitionWrapper(LoginPage)

// A real component (not an IIFE) to guard /login
function LoginRoute() {
  const isAuth = useIsAuthenticated()
  return isAuth
    ? <Navigate to="/dashboard" replace />
    : <WrappedLoginPage />
}

function ProtectedRoute({ children, loginPath = '/login' }) {
  const isAuth = useIsAuthenticated();  // boolean now
  return isAuth
    ? children
   : <Navigate to={loginPath} replace />;
}

export default function App() {
  const location = useLocation()

  return (
    <AnimatePresence initial={false} mode="wait">
      <Routes location={location} >
        {/* Public routes under your global Layout */}
        <Route element={<Layout />}>
          <Route path="/" element={<WrappedHomepage />} />
          <Route path="/login" element={<LoginRoute />} />
          <Route path="/restore" element={<RestoreAccountPage />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact-us" element={<ContactPage />} />
          <Route path="/blog" element={<BlogsPage />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />
          <Route path="/pricing" element={<SubscribePage />} />
          <Route path="/subscribe/success" element={<PaymentSuccesful />} />
        </Route>

        {/* Protected dashboard routes */}
        <Route
          path="/dashboard/*"
          element={
            <ProtectedRoute loginPath="/login">
              <DashboardLayout/>
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardHome />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="category/:slug" element={<CategoryView />} />
          <Route path="playlist/:slug" element={<PlaylistView />} />
          <Route path="song/:id" element={<SongView />} />
          <Route path="search" element={<Search />} />
          <Route path="user-playlists" element={<MyPlaylists />} />
          <Route path="user-playlists/:slug" element={<UserPlaylistView />} />
          <Route path="user-activity/recent-plays" element={<RecentlyPlayed />} />
        </Route>

        {/* Admin login (unprotected) */}
       <Route path="/admin-login" element={<AdminLoginPage />} />

       {/* Protected admin routes */}
       <Route
         path="/admin/*"
         element={
           <ProtectedRoute fallbackPath="/admin-login">
             <AdminRoute>
               <AdminDashboardLayout />
             </AdminRoute>
           </ProtectedRoute>
         }
       >
         {/* Nested admin routes */}
         <Route index element={<Navigate to="users" replace />} />
         <Route path="users" element={<AdminUsersOverview />} />
         <Route path="admins" element={<AdminAdminsOverview />} />
         <Route path="users/:id" element={<AdminUserDetailPage />} />
         <Route path="categories" element={<AdminCategoriesOverview />} />
         <Route path="categories/:id" element={<AdminCategoryDetail />} />
         <Route path="playlists" element={<AdminPlaylistsOverview />} />
         <Route path="playlists/:id" element={<AdminPlaylistDetail />} />
         <Route path="songs" element={<AdminSongsOverview />} /> 
         <Route path="songs/:id" element={<AdminSongDetail />} />
         <Route path="upload" element={<AdminUpload />} />
       </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  )
}
