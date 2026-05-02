/* eslint-disable react/prop-types */
import { Suspense, lazy } from 'react'
import { useLocation, Navigate, Routes, Route } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useAuthStatus } from './hooks/useAuthStatus';
import AuthGate from './components/common/AuthGate'
import { SubscriptionProvider } from './context/SubscriptionContext';
import ScrollToTop from './components/common/ScrollToTop'
import useScrollToTop from './hooks/useScrollToTop';

const Layout = lazy(() => import('./Layout'));
const Homepage = lazy(() => import('./pages/Homepage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const RestoreAccountPage = lazy(() => import('./pages/RestoreAccountPage'));
const About = lazy(() => import('./pages/About'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const SubscribePage = lazy(() => import('./pages/SubscribePage'));
const PaymentSuccesful = lazy(() => import('./components/landing/PaymentSuccesful'));

const DashboardLayout = lazy(() => import('./components/dashboard/DashboardLayout'));
const DashboardHome = lazy(() => import('./pages/DashboardHome'));
const MyPlaylists = lazy(() => import('./pages/MyPlaylists'));
const CategoryView = lazy(() => import('./pages/CategoryView'));
const PlaylistView = lazy(() => import('./pages/PlaylistView'));
const UserPlaylistView = lazy(() => import('./pages/UserPlaylistView'));
const SongView = lazy(() => import('./pages/SongView'));
const Search = lazy(() => import('./pages/Search'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const Devices = lazy(() => import('./pages/DevicesSection'));
const ManageSubscription = lazy(() => import('./pages/ManageSubscription'));
const PersonalizeSection = lazy(() => import('./components/dashboard/Personalized Service/PersonalizeSection'));
const RecentlyPlayed = lazy(() => import('./pages/RecentlyPlayed'));
const BlogsPage = lazy(() => import('./pages/BlogsPage'));
const BlogPostPage = lazy(() => import('./pages/BlogPostPage'));
const BlogCategoryPage = lazy(() => import('./pages/BlogCategoryPage'));
const FAQPage = lazy(() => import('./pages/FaqPage'));

const AdminRoute = lazy(() => import('./components/admin/AdminRoutes'));
const AdminDashboardLayout = lazy(() => import('./components/admin/AdminDashboardLayout'));
const AdminLoginPage = lazy(() => import('./pages/Admin/AdminLoginPage'));
const AdminUsersOverview = lazy(() => import('./pages/Admin/AdminUsersOverview'));
const AdminUserDetailPage = lazy(() => import('./pages/Admin/AdminUserDetailPage'));
const AdminAdminsOverview = lazy(() => import('./pages/Admin/AdminAdminsOverview'));
const AdminCategoriesOverview = lazy(() => import('./pages/Admin/AdminCategoriesOverview'));
const AdminCategoryDetail = lazy(() => import('./pages/Admin/AdminCategoryDetail'));
const AdminPlaylistsOverview = lazy(() => import('./pages/Admin/AdminPlaylistOverview'));
const AdminPlaylistDetail = lazy(() => import('./pages/Admin/AdminPlaylistDetail'));
const AdminSongsOverview = lazy(() => import('./pages/Admin/AdminSongsOverview'));
const AdminSongDetail = lazy(() => import('./pages/Admin/AdminSongDetail'));
const AdminHeroBannerEditor = lazy(() => import('./pages/Admin/AdminHeroBannerEditor'));
const AdminUpload = lazy(() => import('./pages/Admin/AdminR2FileManager'));
const AdminPersonalize = lazy(() => import('./pages/Admin/AdminPersonalize'));
const BasicPersonalize = lazy(() => import('./pages/Admin/BasicPersonalize'));
const BasicPersonalizeSubmissions = lazy(() => import('./pages/Admin/BasicPersonalizeSubmissions'));
const UserRecommendationsList = lazy(() => import('./pages/Admin/UserRecomendationList'));
const AdminBlogsPage = lazy(() => import('./pages/Admin/AdminBlogsPage'));
const AdminBlogEditor = lazy(() => import('./pages/Admin/AdminBlogEditor'));
const AdminBlogCategoryManager = lazy(() => import('./pages/Admin/AdminBlogCategoryManager'));

function PageFallback() {
  return <div className="min-h-screen bg-black text-white" />;
}



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
      <Suspense fallback={<PageFallback />}>
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
          <Route path="blog/category/:slug" element={<BlogCategoryPage />} />
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
         <Route path="personalize-basic-submissions" element={<BasicPersonalizeSubmissions />} />
         <Route path="personalize-users" element={<UserRecommendationsList />} />
         <Route path="blogs" element={<AdminBlogsPage />} />
         <Route path="blogs/:id" element={<AdminBlogEditor />} />
         <Route path="blog-categories" element={<AdminBlogCategoryManager />} />
       </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
    </Suspense>
    </SubscriptionProvider>
    </>
    
  )
}
