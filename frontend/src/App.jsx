// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

import Layout from './Layout';
import Homepage from './pages/Homepage';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './components/dashboard/DashboardLayout';
import DashboardHome from './pages/DashboardHome';
import CategoryView from './pages/CategoryView';
import PlaylistView from './pages/PlaylistView';
import Search from './pages/Search';


const ProtectedRoute = ({ children }) => {
  const isAuth = useSelector((state) => state.auth.isAuthenticated);
  return isAuth ? children : <Navigate to="/login" replace />;
};

export default function App() {
  return (
    <Router>
      <Routes>
        
        <Route element={<Layout />}>  
          <Route path="/" element={<Homepage />} />
          <Route path="/login" element={<LoginPage />} />

          
          <Route
            path="dashboard/*"
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
        </Route>
      </Routes>
    </Router>
  );
}
