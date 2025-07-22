import { useState, useEffect, ReactNode, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import EditorDash from './pages/EditorDash';
import ClipViewer from './pages/Clips/Index'
import ClipSearch from './pages/ClipSearch';
import Home from './pages/Home';
import AdminDash from './pages/Admin/Index';
import ResetPassword from './pages/ResetPassword';
import PrivacyStatement from './pages/PrivacyStatement';
import ProfilePage from './pages/Profile/Index';
import { motion } from 'framer-motion';
import { FaLock, FaShieldAlt, FaUserCheck } from 'react-icons/fa';
import { NotificationProvider } from './context/AlertContext';
import NotificationContainer from './components/PopupAlerts/NotificationContainer';
import NotificationsPage from './pages/NotificationsPage';
import { LazyRoutes } from './lib/lazy-routes';
import { User } from './types/adminTypes';
import { useCurrentUser } from './hooks/useUser';

interface RequireAuthProps {
  children: ReactNode;
  isAdminRequired?: boolean;
  isEditorRequired?: boolean;
  isVerifiedRequired?: boolean;
}

interface NavigateState {
  alert: string;
}

function ClipSesh() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  // Use React Query hook for current user
  const { data: userData, isLoading: userLoading, error: userError } = useCurrentUser();

  useEffect(() => {
    const extractTokenFromURL = (): void => {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      if (token) {
        localStorage.setItem('token', token);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    };

    extractTokenFromURL();
  }, []);

  // Update user state when React Query data changes
  useEffect(() => {
    if (userData) {
      setUser(userData);
      setAuthLoading(false);
    } else if (userError) {
      setUser(null);
      localStorage.removeItem('token');
      setAuthLoading(false);
    } else if (!userLoading) {
      setUser(null);
      setAuthLoading(false);
    }
  }, [userData, userError, userLoading]);
  const RequireAuth: React.FC<RequireAuthProps> = ({
    children,
    isAdminRequired = false,
    isEditorRequired = false,
    isVerifiedRequired = false
  }) => {
    const [authCheckComplete, setAuthCheckComplete] = useState<boolean>(false);
    const [showVerificationModal, setShowVerificationModal] = useState<boolean>(true);
    const [loadingMessage, setLoadingMessage] = useState<string>('Checking authentication...');

    useEffect(() => {
      // Set up different messages for different auth checks
      if (isAdminRequired) {
        setLoadingMessage('Verifying Admin privileges...');
      } else if (isEditorRequired) {
        setLoadingMessage('Verifying Editor privileges...');
      } else if (isVerifiedRequired) {
        setLoadingMessage('Verifying ClipTeam privileges...');
      }

      // Hide verification modal after a shorter delay for better responsiveness
      const timer = setTimeout(() => {
        setAuthCheckComplete(true);
        setTimeout(() => {
          setShowVerificationModal(false);
        }, 200);
      }, 600);

      return () => clearTimeout(timer);
    }, [isAdminRequired, isEditorRequired, isVerifiedRequired]);

    // Wait for authentication to complete before making any checks
    if (authLoading) {
      return (
        <div className="relative">
          <div className="blur-sm pointer-events-none">
            {children}
          </div>
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
              <div className="flex flex-col items-center text-center">
                <div className="mb-6">
                  <FaLock className="text-5xl text-blue-500" />
                </div>
                <h2 className="text-2xl font-bold mb-3 text-neutral-900 dark:text-white">
                  Loading...
                </h2>
                <p className="text-lg text-neutral-600 dark:text-neutral-300 mb-6">
                  Checking authentication status...
                </p>
                <div className="flex justify-center items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping" style={{ animationDelay: '0s' }}></div>
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Check authentication status
    if (!user) {
      return <Navigate to="/clips" replace state={{ alert: "You must be logged in to view this page." } as NavigateState} />;
    }

    if (isAdminRequired && !user.roles.includes('admin')) {
      return <Navigate to="/clips" replace state={{ alert: "You must have admin rights to do this!" } as NavigateState} />;
    }

    if (isEditorRequired && !(user.roles.includes('admin') || user.roles.includes('editor'))) {
      return <Navigate to="/clips" replace state={{ alert: "You must have editor rights to do this!" } as NavigateState} />;
    }

    if (isVerifiedRequired && !(user.roles.includes('admin') || user.roles.includes('clipteam'))) {
      return <Navigate to="/clips" replace state={{ alert: "You must have verified rights to do this!" } as NavigateState} />;
    }

    return (
      <div className="relative">
        {/* Render the page content immediately but blurred */}
        <div className={showVerificationModal ? "blur-sm pointer-events-none" : ""}>
          {children}
        </div>

        {/* Verification Modal Overlay */}
        {showVerificationModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4"
            >
              <div className="flex flex-col items-center text-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1, rotate: [0, 10, 0] }}
                  transition={{ duration: 0.5 }}
                  className="mb-6 relative"
                >
                  {isAdminRequired ? (
                    <FaShieldAlt className="text-5xl text-red-500" />
                  ) : isVerifiedRequired ? (
                    <FaUserCheck className="text-5xl text-blue-500" />
                  ) : (
                    <FaLock className="text-5xl text-amber-500" />
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

                <motion.h2
                  className="text-2xl font-bold mb-3 text-neutral-900 dark:text-white"
                  initial={{ y: -10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  Secure Access Required
                </motion.h2>

                <motion.p
                  className="text-lg text-neutral-600 dark:text-neutral-300 mb-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  {loadingMessage}
                </motion.p>

                <motion.div
                  className="flex justify-center items-center gap-2"
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: authCheckComplete ? [1, 0] : 1,
                    transition: {
                      opacity: { duration: 0.2 },
                      delay: 0.4
                    }
                  }}
                >
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping" style={{ animationDelay: '0s' }}></div>
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping" style={{ animationDelay: '0.4s' }}></div>
                </motion.div>

                <motion.div
                  className="w-full mt-6"
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: "100%", opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="w-full h-1 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                      initial={{ width: 0 }}
                      animate={{ width: authCheckComplete ? '100%' : '85%' }}
                      transition={{
                        duration: authCheckComplete ? 0.1 : 0.6,
                        ease: "easeOut"
                      }}
                    />
                  </div>
                  <p className="text-center mt-2 text-xs text-neutral-400">
                    {authCheckComplete ? 'Access granted!' : 'Validating credentials...'}
                  </p>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    );
  };

  return (
    <Router>
      <NotificationProvider>
        <div className="flex flex-col min-h-screen">
          <Navbar user={user} setUser={setUser} />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/editor" element={<RequireAuth isEditorRequired={true}><EditorDash /></RequireAuth>} />
              <Route path="/clips" element={<ClipViewer />} />
              <Route path="/clips/:clipId" element={<ClipViewer />} />
              <Route path="/search" element={<ClipSearch />} />
              <Route path="/admin" element={<RequireAuth isAdminRequired={true}><AdminDash /></RequireAuth>} />
              <Route path="/profile" element={
                <RequireAuth>
                  <ProfilePage currentUser={user || undefined} />
                </RequireAuth>
              } />
              <Route path="/profile/:userId" element={<ProfilePage currentUser={user || undefined} />} />
              <Route path="/notifications" element={
                <RequireAuth>
                  <NotificationsPage />
                </RequireAuth>
              } />
              <Route path="/my-reports" element={
                <RequireAuth>
                  <Suspense fallback={<div className="flex justify-center items-center h-64">Loading...</div>}>
                    <LazyRoutes.UserReportsPage />
                  </Suspense>
                </RequireAuth>
              } />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/privacystatement" element={<PrivacyStatement />} />
            </Routes>
          </main>
          <Footer />
          <NotificationContainer />
        </div>
      </NotificationProvider>
    </Router>
  );
}

export default ClipSesh;
