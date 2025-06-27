import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { AnimatePresence } from 'framer-motion';

import Layout from './Layout';
import Homepage from './pages/Homepage';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './components/dashboard/DashboardLayout';
import DashboardHome from './pages/DashboardHome';
import CategoryView from './pages/CategoryView';
import PlaylistView from './pages/PlaylistView';
import Search from './pages/Search';
import TransitionWrapper from './components/custom-ui/transition';

// Wrap public pages using the HOC
const WrappedHomepage = TransitionWrapper(Homepage);
const WrappedLoginPage = TransitionWrapper(LoginPage);

const ProtectedRoute = ({ children }) => {
  const isAuth = useSelector((state) => state.auth.isAuthenticated);
  return isAuth ? children : <Navigate to="/login" replace />;
};

function AppWrapper() {
  const location = useLocation();

  return (
    <AnimatePresence initial={false} mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public routes with page transitions */}
        <Route element={<Layout />}>  
          <Route path="/" element={<WrappedHomepage />} />
          <Route path="/login" element={<WrappedLoginPage />} />
        </Route>

        {/* Dashboard routes without page transitions */}
        <Route
          path="/dashboard/*"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardHome />} />
          <Route path="category/:slug" element={<CategoryView />} />
          <Route path="playlist/:slug" element={<PlaylistView />} />
          <Route path="search" element={<Search />} />
        </Route>
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <Router>
      <AppWrapper />
    </Router>
  );
}
