import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from './pages/components/Navbar';
import Footer from './pages/components/Footer';
import EditorDash from './pages/EditorDash';
import ClipViewer from './pages/ClipViewer'
import ClipSearch from './pages/ClipSearch';
import Home from './pages/Home';
import AdminDash from './pages/AdminDash';
import ResetPassword from './pages/ResetPassword';
import PrivacyStatement from './pages/PrivacyStatement';
import ProfilePage from './pages/ProfilePage';
import Stats from './pages/Stats';
import background from './media/background.jpg';
import apiUrl from './config/config';
import { motion } from 'framer-motion';
import { FaLock, FaShieldAlt, FaUserCheck } from 'react-icons/fa';


function ClipSesh() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const extractTokenFromURL = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      if (token) {
        localStorage.setItem('token', token);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    };

    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await axios.get(`${apiUrl}/api/users/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setUser(response.data);
        } catch (error) {
          console.error('Error fetching user:', error);
          // Clear invalid token
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };

    extractTokenFromURL();
    fetchUser();
  }, []);

  const RequireAuth = ({ children, isAdminRequired = false, isEditorRequired = false, isVerifiedRequired = false }) => {
    const [authCheckComplete, setAuthCheckComplete] = useState(false);
    const [showLoadingScreen, setShowLoadingScreen] = useState(true);
    const [loadingMessage, setLoadingMessage] = useState('Checking authentication...');

    useEffect(() => {
      // Set up different messages for different auth checks
      if (isAdminRequired) {
        setLoadingMessage('Verifying admin privileges...');
      } else if (isEditorRequired) {
        setLoadingMessage('Verifying editor access...');
      } else if (isVerifiedRequired) {
        setLoadingMessage('Verifying team membership...');
      }
      
      // Hide loading screen after a short delay to allow animations to play
      const timer = setTimeout(() => {
        setAuthCheckComplete(true);
        setTimeout(() => {
          setShowLoadingScreen(false);
        }, 300); // Small fade out delay
      }, 800);

      return () => clearTimeout(timer);
    }, [isAdminRequired, isEditorRequired, isVerifiedRequired]);

    if (showLoadingScreen) {
      return (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-neutral-200 dark:bg-neutral-900 transition-all duration-300 flex flex-col"
        >
          <div 
            className="w-full h-96 bg-cover bg-center relative"
            style={{ 
              backgroundImage: `url(${background})`, 
              clipPath: 'polygon(0 0, 100% 0, 100% 80%, 0 100%)' 
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-neutral-900/80 to-black/40 backdrop-blur-sm flex items-center justify-center">
              <div className="flex flex-col items-center justify-center text-white px-4 max-w-xl mx-auto">
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1, rotate: [0, 10, 0] }}
                  transition={{ duration: 0.5 }}
                  className="mb-6 relative"
                >
                  {isAdminRequired ? (
                    <FaShieldAlt className="text-6xl text-red-500" />
                  ) : isVerifiedRequired ? (
                    <FaUserCheck className="text-6xl text-blue-500" />
                  ) : (
                    <FaLock className="text-6xl text-amber-500" />
                  )}
                  <motion.div 
                    className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full"
                    animate={{ 
                      scale: [1, 1.5, 1],
                      opacity: [1, 0.5, 1] 
                    }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                  />
                </motion.div>
                
                <motion.h1 
                  className="text-3xl md:text-4xl font-bold mb-2 text-center"
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  Secure Access Required
                </motion.h1>
                
                <motion.div
                  className="flex items-center gap-4 mb-8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <span className="h-px bg-white/30 flex-1"></span>
                  <span className="text-white/70 text-sm uppercase tracking-wider">ClipSesh</span>
                  <span className="h-px bg-white/30 flex-1"></span>
                </motion.div>
                
                <motion.p 
                  className="text-xl text-center text-white/90 max-w-md"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  {loadingMessage}
                </motion.p>
                
                <motion.div 
                  className="mt-8 flex justify-center items-center gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ 
                    opacity: authCheckComplete ? [1, 0] : 1,
                    transition: { 
                      opacity: { duration: 0.3 },
                      delay: 0.5
                    }
                  }}
                >
                  <div className="w-3 h-3 rounded-full bg-blue-500 animate-ping" style={{ animationDelay: '0s' }}></div>
                  <div className="w-3 h-3 rounded-full bg-blue-500 animate-ping" style={{ animationDelay: '0.3s' }}></div>
                  <div className="w-3 h-3 rounded-full bg-blue-500 animate-ping" style={{ animationDelay: '0.6s' }}></div>
                </motion.div>
              </div>
            </div>
          </div>
          
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <motion.div 
              className="relative w-full max-w-md"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <div className="w-full h-2 bg-neutral-300 dark:bg-neutral-700 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-blue-500"
                  initial={{ width: 0 }}
                  animate={{ width: authCheckComplete ? '100%' : '90%' }}
                  transition={{ 
                    duration: authCheckComplete ? 0.2 : 0.8,
                    ease: "easeOut" 
                  }}
                />
              </div>
              <p className="text-center mt-3 text-sm text-neutral-500 dark:text-neutral-400">
                {authCheckComplete ? 'Authentication complete!' : 'Validating credentials...'}
              </p>
            </motion.div>
          </div>
        </motion.div>
      );
    }

    if (!user) {
      return <Navigate to="/clips" replace state={{ alert: "You must be logged in to view this page." }} />;
    }

    if (isAdminRequired && !user.roles.includes('admin')) {
      return <Navigate to="/clips" replace state={{ alert: "You must have admin rights to do this!" }} />;
    }

    if (isEditorRequired && !(user.roles.includes('admin') || user.roles.includes('editor'))) {
      return <Navigate to="/clips" replace state={{ alert: "You must have editor rights to do this!" }} />;
    }

    if (isVerifiedRequired && !(user.roles.includes('admin') || user.roles.includes('clipteam'))) {
      return <Navigate to="/clips" replace state={{ alert: "You must have verified rights to do this!" }} />;
    }

    return children;
  };

  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <Navbar user={user} setUser={setUser} />
        <main className="flex-grow">
          <Routes>
            <Route exact path="/" element={<Home />} />
            <Route path="/editor" element={<RequireAuth isEditorRequired={true}><EditorDash /></RequireAuth>} />
            <Route path="/clips" element={<ClipViewer />} />
            <Route path="/clips/:clipId" element={<ClipViewer />} />
            <Route path="/search" element={<ClipSearch />} />
            <Route path="/admin" element={<RequireAuth isAdminRequired={true}><AdminDash /></RequireAuth>} />
            <Route path="/profile" element={<RequireAuth><ProfilePage user={user} setUser={setUser} /></RequireAuth>} />
            <Route path="/stats" element={<RequireAuth isVerifiedRequired={true}><Stats user={user} setUser={setUser} /></RequireAuth>} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/privacystatement" element={<PrivacyStatement />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default ClipSesh;
