import React, { useState, useEffect } from 'react';
import axios from 'axios';
import apiUrl from '../../config/config';
import { motion, AnimatePresence } from 'framer-motion';
import { TbLoader2 } from "react-icons/tb";
import { FaDiscord, FaTimes, FaEnvelope, FaLock, FaUser } from "react-icons/fa";

const LoginModal = ({ setIsLoginModalOpen, isLoginModalOpen, fetchUser }) => {
  const [formMode, setFormMode] = useState('login');
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [email, setEmail] = useState('');
  const [resetMessage, setResetMessage] = useState({ type: '', message: '' });
  const [awaitingReset, setAwaitingReset] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Close modal when Escape key is pressed
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') handleClose();
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(''); // Clear error when user types
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    setResetMessage({ type: '', message: '' });
  };

  const handleClose = () => {
    const modalContent = document.querySelector('.modal-content');
    const modalOverlay = document.querySelector('.login-modal-overlay');
    
    if (modalContent && modalOverlay) {
      modalContent.style.transition = 'transform 300ms, opacity 300ms';
      modalContent.style.transform = 'scale(0.9)';
      modalContent.style.opacity = '0';
      modalOverlay.style.transition = 'opacity 300ms';
      modalOverlay.style.opacity = '0';
      setTimeout(() => setIsLoginModalOpen(false), 300);
    } else {
      setIsLoginModalOpen(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    
    const url = formMode === 'register'
      ? `${apiUrl}/api/users/register`
      : `${apiUrl}/api/users/login`;
      
    try {
      const response = await axios.post(url, formData);
      if (formMode === 'register') {
        setFormMode('login');
        setFormData({ ...formData, password: '' });
        setResetMessage({ 
          type: 'success', 
          message: 'Registration successful! Please login with your credentials.' 
        });
      } else {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('username', response.data.username);
        await fetchUser();
        handleClose();
      }
    } catch (error) {
      console.error('Error:', error);
      if (error.response) {
        if (error.response.status === 403) {
          setError('Account awaiting admin approval.');
        } else if (error.response.status === 400) {
          setError(error.response.data.message || 'Invalid username or password.');
        } else if (error.response.status === 409) {
          setError('Username already exists. Please choose another.');
        } else {
          setError('An error occurred. Please try again later.');
        }
      } else {
        setError('Network error. Please check your connection.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email.trim()) {
      setResetMessage({ type: 'error', message: 'Please enter your email address.' });
      return;
    }
    
    try {
      setAwaitingReset(true);
      setResetMessage({ type: '', message: '' });
      
      await axios.post(`${apiUrl}/api/users/resetPassword`, { email });
      
      setResetMessage({ 
        type: 'success', 
        message: `Password reset instructions sent to ${email}. Please check your inbox.` 
      });
    } catch (error) {
      if (error.response && error.response.status === 404) {
        setResetMessage({ type: 'error', message: 'Email not found. Please try again.' });
      } else {
        setResetMessage({ type: 'error', message: 'Failed to reset password. Please try again later.' });
      }
    } finally {
      setAwaitingReset(false);
    }
  };

  const handleDiscordLogin = () => {
    window.location.href = `${apiUrl}/api/discord/auth`;
  };

  // Modal animation variants
  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, transition: { duration: 0.3 } }
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { type: 'spring', damping: 25, stiffness: 500 } },
    exit: { opacity: 0, scale: 0.8, transition: { duration: 0.3 } }
  };

  return (
    <AnimatePresence>
      {isLoginModalOpen && (
        <motion.div
          className="login-modal-overlay fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50"
          onClick={(e) => e.target === e.currentTarget && handleClose()}
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <motion.div 
            className="modal-content relative bg-white dark:bg-neutral-800 rounded-2xl shadow-xl max-w-md w-full mx-4"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
            style={{ margin: 'auto' }}
          >
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-700"
              aria-label="Close"
            >
              <FaTimes size={20} />
            </button>

            <div className="p-8">
              {formMode === 'login' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <h2 className="text-3xl font-bold text-neutral-900 dark:text-white mb-6">Sign In</h2>
                  {error && (
                    <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-900 text-red-800 dark:text-red-300 rounded-lg text-sm">
                      {error}
                    </div>
                  )}
                  {resetMessage.type === 'success' && (
                    <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-900 text-green-800 dark:text-green-300 rounded-lg text-sm">
                      {resetMessage.message}
                    </div>
                  )}
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="login-username" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        Username
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FaUser className="text-neutral-500" />
                        </div>
                        <input
                          id="login-username"
                          type="text"
                          name="username"
                          placeholder="Enter your username"
                          value={formData.username}
                          onChange={handleChange}
                          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="login-password" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FaLock className="text-neutral-500" />
                        </div>
                        <input
                          id="login-password"
                          type="password"
                          name="password"
                          placeholder="Enter your password"
                          value={formData.password}
                          onChange={handleChange}
                          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                    </div>
                    
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg transition duration-200 flex items-center justify-center font-medium"
                    >
                      {isSubmitting ? (
                        <>
                          <TbLoader2 className="animate-spin mr-2" />
                          Signing in...
                        </>
                      ) : (
                        'Sign In'
                      )}
                    </button>
                    
                    <div className="relative py-2">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-neutral-300 dark:border-neutral-700"></div>
                      </div>
                      <div className="relative flex justify-center">
                        <span className="px-2 bg-white dark:bg-neutral-800 text-sm text-neutral-500">
                          or continue with
                        </span>
                      </div>
                    </div>
                    
                    <button
                      type="button"
                      onClick={handleDiscordLogin}
                      className="w-full flex items-center justify-center gap-2 bg-indigo-700 hover:bg-indigo-800 text-white py-2.5 rounded-lg transition duration-200"
                    >
                      <FaDiscord size={20} />
                      Sign in with Discord
                    </button>
                  </form>
                  
                  <div className="mt-6 flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-4 text-center justify-center">
                    <button
                      onClick={() => {
                        setFormMode('register');
                        setError('');
                      }}
                      className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                    >
                      Don't have an account? Register
                    </button>
                    <button
                      onClick={() => {
                        setFormMode('reset');
                        setError('');
                      }}
                      className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                    >
                      Forgot your password?
                    </button>
                  </div>
                </motion.div>
              )}

              {formMode === 'register' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <h2 className="text-3xl font-bold text-neutral-900 dark:text-white mb-6">Create Account</h2>
                  {error && (
                    <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-900 text-red-800 dark:text-red-300 rounded-lg text-sm">
                      {error}
                    </div>
                  )}
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="register-username" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        Username
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FaUser className="text-neutral-500" />
                        </div>
                        <input
                          id="register-username"
                          type="text"
                          name="username"
                          placeholder="Choose a username"
                          value={formData.username}
                          onChange={handleChange}
                          maxLength={30}
                          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                        {formData.username.length > 0 && (
                          <div className={`absolute bottom-2 right-2 text-xs px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-600 ${
                            formData.username.length === 30 ? 'text-red-600 dark:text-red-400' : 'text-neutral-500 dark:text-neutral-400'
                          }`}>
                            {formData.username.length}/30
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="register-password" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FaLock className="text-neutral-500" />
                        </div>
                        <input
                          id="register-password"
                          type="password"
                          name="password"
                          placeholder="Create a strong password"
                          value={formData.password}
                          onChange={handleChange}
                          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                    </div>
                    
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg transition duration-200 flex items-center justify-center font-medium"
                    >
                      {isSubmitting ? (
                        <>
                          <TbLoader2 className="animate-spin mr-2" />
                          Creating account...
                        </>
                      ) : (
                        'Create Account'
                      )}
                    </button>
                    
                    <div className="relative py-2">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-neutral-300 dark:border-neutral-700"></div>
                      </div>
                      <div className="relative flex justify-center">
                        <span className="px-2 bg-white dark:bg-neutral-800 text-sm text-neutral-500">
                          or register with
                        </span>
                      </div>
                    </div>
                    
                    <button
                      type="button"
                      onClick={handleDiscordLogin}
                      className="w-full flex items-center justify-center gap-2 bg-indigo-700 hover:bg-indigo-800 text-white py-2.5 rounded-lg transition duration-200"
                    >
                      <FaDiscord size={20} />
                      Register with Discord
                    </button>
                  </form>
                  
                  <div className="mt-6 text-center">
                    <button
                      onClick={() => {
                        setFormMode('login');
                        setError('');
                      }}
                      className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                    >
                      Already have an account? Sign in
                    </button>
                  </div>
                </motion.div>
              )}

              {formMode === 'reset' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <h2 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">Reset Password</h2>
                  <p className="mb-6 text-neutral-600 dark:text-neutral-400 text-sm">
                    Enter your email address and we'll send you instructions to reset your password.
                  </p>
                  
                  {resetMessage.type && (
                    <div className={`mb-4 p-3 rounded-lg text-sm ${
                      resetMessage.type === 'success' 
                        ? 'bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-900 text-green-800 dark:text-green-300' 
                        : 'bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-900 text-red-800 dark:text-red-300'
                    }`}>
                      {resetMessage.message}
                    </div>
                  )}
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="reset-email" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        Email Address
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FaEnvelope className="text-neutral-500" />
                        </div>
                        <input
                          id="reset-email"
                          type="email"
                          placeholder="Enter your email"
                          value={email}
                          onChange={handleEmailChange}
                          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    
                    <button
                      onClick={handlePasswordReset}
                      disabled={awaitingReset || !email.trim()}
                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 dark:disabled:bg-blue-800 disabled:cursor-not-allowed text-white py-2.5 rounded-lg transition duration-200 flex items-center justify-center font-medium"
                    >
                      {awaitingReset ? (
                        <>
                          <TbLoader2 className="animate-spin mr-2" />
                          Processing...
                        </>
                      ) : (
                        'Reset Password'
                      )}
                    </button>
                  </div>
                  
                  <div className="mt-6 text-center">
                    <button
                      onClick={() => {
                        setFormMode('login');
                        setResetMessage({ type: '', message: '' });
                      }}
                      className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                    >
                      Back to Sign In
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoginModal;
