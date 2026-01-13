import React from 'react'
import { useLocation, Navigate, Routes, Route } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useAuthStatus } from './hooks/useAuthStatus';
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
import Devices from './pages/DevicesSection';
import TransitionWrapper from './components/custom-ui/transition'
import AuthGate from './components/common/AuthGate'
import SubscribePage from './pages/SubscribePage'
import PaymentSuccesful from './components/landing/PaymentSuccesful'
import ManageSubscription from './pages/ManageSubscription'
import PersonalizeSection from './components/dashboard/Personalized Service/PersonalizeSection';
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
import AdminHeroBannerEditor from './pages/Admin/AdminHeroBannerEditor'
import AdminUpload from './pages/Admin/AdminR2FileManager'
import AdminAdminsOverview from './pages/Admin/AdminAdminsOverview'
import AdminPersonalize from './pages/Admin/AdminPersonalize';
import BasicPersonalize from './pages/Admin/BasicPersonalize';
import UserRecommendationsList from './pages/Admin/UserRecomendationList';
import RecentlyPlayed from './pages/RecentlyPlayed'
import useOneTimePreloader from './hooks/useOneTimePreloader'
import Preloader from './components/custom-ui/Preloader'
import { SubscriptionProvider } from './context/SubscriptionContext';
import ScrollToTop from './components/common/ScrollToTop'
import useScrollToTop from './hooks/useScrollToTop';
import PWAInstallBanner from "./components/common/PWAInstallBanner";
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import FAQPage from './pages/FaqPage';
import AdminBlogsPage from './pages/Admin/AdminBlogsPage';
import AdminBlogEditor from './pages/Admin/AdminBlogEditor';



function LoginRoute() {
  const { isAuth } = useAuthStatus();

  // Avoid redirect flicker while checking
  if (isAuth === null) {
    return <AuthGate loading />;
  }

  return isAuth
    ? <Navigate to="/dashboard" replace />
    : <LoginPage />;
}

function ProtectedRoute({ children, loginPath = '/login' }) {
  const { isAuth } = useAuthStatus();

  if (isAuth === null) {
    return <AuthGate loading />;
  }

  return isAuth
    ? children
    : <Navigate to={loginPath} replace />;
}

export default function App() {
  // const { show, complete } = useOneTimePreloader({
  //   storageKey: "preloader_seen",
  // });
  //if (show === undefined) return null;
  const location = useLocation()
  useScrollToTop();

  return (
    <>
      <SubscriptionProvider>
      {/* <PWAInstallBanner /> */}
      {/* {show && <Preloader isVisible onComplete={complete} />} */}
      <ScrollToTop delay={150} />
      <AnimatePresence initial={false} mode="wait">
      <Routes location={location} >
        {/* Public routes under your global Layout */}
        <Route element={<Layout />}>
          <Route path="/" element={<Homepage />} />
          <Route path="/login" element={<LoginRoute />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/restore" element={<RestoreAccountPage />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact-us" element={<ContactPage />} />
          {/* <Route path="/blog" element={<BlogsPage />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} /> */}
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
          <Route path="devices" element={<Devices />} />
          <Route path="manage-subscription" element={<ManageSubscription />} />
          <Route path="category/:slug" element={<CategoryView />} />
          <Route path="playlist/:slug" element={<PlaylistView />} />
          <Route path="song/:slug" element={<SongView />} />
          <Route path="search" element={<Search />} />
          <Route path="user-playlists" element={<MyPlaylists />} />
          <Route path="user-playlists/:slug" element={<UserPlaylistView />} />
          <Route path="user-activity/recent-plays" element={<RecentlyPlayed />} />
          <Route path="personalize" element={<PersonalizeSection />} />
          <Route path="blog" element={<BlogsPage />} />
          <Route path="blog/:slug" element={<BlogPostPage />} />
          <Route path="faqs" element={<FAQPage />} />
        </Route>

        {/* Admin login (unprotected) */}
       <Route path="/admin-login" element={<AdminLoginPage />} />

       {/* Protected admin routes */}
       <Route
         path="/admin/*"
         element={
           <ProtectedRoute loginPath="/admin-login">
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
         <Route path="hero-banner" element={<AdminHeroBannerEditor />} />
         <Route path="upload" element={<AdminUpload />} />
         <Route path="personalize" element={<AdminPersonalize />} />
         <Route path="personalize-basic" element={<BasicPersonalize />} />
         <Route path="personalize-users" element={<UserRecommendationsList />} />
         <Route path="blogs" element={<AdminBlogsPage />} />
         <Route path="blogs/:id" element={<AdminBlogEditor />} />
       </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
    </SubscriptionProvider>
    </>
    
  )
}
