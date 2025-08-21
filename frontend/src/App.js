import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './components/Login';
import Signup from './components/Signup';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import Home from './components/Home';
import Profile from './components/Profile';
import EditProfile from './components/EditProfile';
import MessagesPage from './components/MessagesPage';
import Notifications from './components/Notifications';
import CreatePost from './components/CreatePost';
import CreateStory from './components/CreateStory';
import StoryViewer from './components/StoryViewer';
import Bookmarks from './components/Bookmarks';
import Archive from './components/Archive';
import PostModal from './components/PostModal';
import Navbar from './components/Navbar';
import { initializeTheme } from './utils/themeUtils';
import './App.css';

import './styles/theme.css';

function AppContent() {

  const location = useLocation();
  // Hide sidebar on auth pages
  const hideSidebar = [
    '/login',
    '/signup',
    '/forgot-password',
  ].some((path) => location.pathname.startsWith(path)) ||
    location.pathname.startsWith('/reset-password');

  return (
    <div className="App">
      {!hideSidebar && <Navbar />}
      <div className={!hideSidebar ? 'main-content' : ''}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:resettoken" element={<ResetPassword />} />
          <Route path="/home" element={<Home />} />
          <Route path="/profile/:username" element={<Profile />} />
          <Route path="/edit-profile" element={<EditProfile />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/messages/:username" element={<MessagesPage />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/create-post" element={<CreatePost />} />
          <Route path="/create-story" element={<CreateStory />} />
          <Route path="/story/:id" element={<StoryViewer />} />
          <Route path="/archive" element={<Archive />} />
          <Route path="/bookmarks" element={<Bookmarks />} />
          <Route path="/post/:postId" element={<PostModal />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  useEffect(() => {
    // Initialize theme on app load
    initializeTheme();
  }, []);

  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
