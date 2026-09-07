import { safeLocalStorage } from '@/utils/storage';
import { useState, useEffect } from 'react';
import axios from 'axios';
const apiUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || '') || 'https://api.spoekle.com';
import { motion, AnimatePresence } from 'framer-motion';
import { TbLoader2 } from "react-icons/tb";
import { FaDiscord, FaTimes, FaEnvelope, FaLock, FaUser } from "react-icons/fa";
import { useLoginUser, useRegisterUser } from '../hooks/useUser';
import { requestPasswordReset } from '../services/userService';
import OfflineWarning from './common/OfflineWarning';

interface LoginModalProps {
  setIsLoginModalOpen: (isOpen: boolean) => void;
  isLoginModalOpen: boolean;
}

const LoginModal: React.FC<LoginModalProps> = ({ setIsLoginModalOpen, isLoginModalOpen }) => {
  const loginMutation = useLoginUser();
  const registerMutation = useRegisterUser();

  const [formMode, setFormMode] = useState('login');
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [email, setEmail] = useState('');
  const [resetMessage, setResetMessage] = useState({ type: '', message: '' });
  const [awaitingReset, setAwaitingReset] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setResetMessage({ type: '', message: '' });
  };

  const handleClose = () => {
    const modalContent = document.querySelector('.modal-content') as HTMLElement;
    const modalOverlay = document.querySelector('.login-modal-overlay') as HTMLElement;

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
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (formMode === 'register') {
        await registerMutation.mutateAsync(formData);
        setFormMode('login');
        setFormData({ ...formData, password: '' });
        setResetMessage({
          type: 'success',
          message: 'Registration successful! Please login with your credentials.'
        });
      } else {
        const response = await loginMutation.mutateAsync(formData);
        safeLocalStorage.setItem('token', response.token);
        safeLocalStorage.setItem('username', response.username);
        handleClose();
      }
    } catch (error) {
      console.error('Error:', error);
      if (axios.isAxiosError(error)) {
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
      } else {
        setError('An unexpected error occurred.');
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

      await requestPasswordReset(email);

      setResetMessage({
        type: 'success',
        message: `Password reset instructions sent to ${email}. Please check your inbox.`
      });
    } catch (error) {
      if (axios.isAxiosError(error) && error.response && error.response.status === 404) {
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

  const overlayVariants: any = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, transition: { duration: 0.3 } }
  };

  const modalVariants: any = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { type: 'spring', damping: 25, stiffness: 500 } },
    exit: { opacity: 0, scale: 0.8, transition: { duration: 0.3 } }
  };

  return (
    <AnimatePresence>
      {isLoginModalOpen && (
        <motion.div
          className="login-modal-overlay fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-200"
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
          onClick={(e) => e.target === e.currentTarget && handleClose()}
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <motion.div
            className="modal-content relative bg-[#181818] rounded-2xl shadow-2xl max-w-md w-full mx-4 border border-[#262626]"
            style={{ maxHeight: '90vh', overflowY: 'auto' }}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 text-[#aaaaaa] hover:text-white transition-colors rounded-full hover:bg-[#262626]"
              aria-label="Close"
            >
              <FaTimes size={16} />
            </button>

            <div className="p-8">
              {formMode === 'login' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <h2 className="text-2xl font-bold text-[#f1f1f1] mb-2">Sign In</h2>
                  <p className="text-sm text-[#aaaaaa] mb-6">Enter your credentials to access your account</p>
                  
                  {error && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-sm">
                      {error}
                    </div>
                  )}
                  {resetMessage.type === 'success' && (
                    <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 text-green-400 rounded-xl text-sm">
                      {resetMessage.message}
                    </div>
                  )}

                  <OfflineWarning
                    message="Login requires an internet connection"
                    className="mb-4"
                  />

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <label htmlFor="login-username" className="block text-xs font-semibold uppercase tracking-wider text-[#aaaaaa]">
                        Username
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                          <FaUser className="text-[#717171]" size={14} />
                        </div>
                        <input
                          id="login-username"
                          type="text"
                          name="username"
                          placeholder="Enter your username"
                          value={formData.username}
                          onChange={handleChange}
                          className="bg-[#121212] border border-[#262626] text-white focus:border-[#f23030] rounded-xl pl-10 pr-4 py-2.5 w-full text-sm outline-none transition-colors"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="login-password" className="block text-xs font-semibold uppercase tracking-wider text-[#aaaaaa]">
                        Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                          <FaLock className="text-[#717171]" size={14} />
                        </div>
                        <input
                          id="login-password"
                          type="password"
                          name="password"
                          placeholder="Enter your password"
                          value={formData.password}
                          onChange={handleChange}
                          className="bg-[#121212] border border-[#262626] text-white focus:border-[#f23030] rounded-xl pl-10 pr-4 py-2.5 w-full text-sm outline-none transition-colors"
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-[#f23030] hover:bg-[#d92222] text-white w-full py-2.5 rounded-full font-semibold shadow-md shadow-[#f23030]/20 flex items-center justify-center text-sm transition-all"
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
                        <div className="w-full border-t border-[#262626]"></div>
                      </div>
                      <div className="relative flex justify-center">
                        <span className="px-2 bg-[#181818] text-xs text-[#717171]">
                          or continue with
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleDiscordLogin}
                      className="w-full flex items-center justify-center gap-2 bg-[#5865F2] hover:bg-[#4752C4] text-white py-2.5 rounded-full transition duration-150 text-sm font-medium shadow-sm"
                    >
                      <FaDiscord size={18} />
                      Sign in with Discord
                    </button>
                  </form>

                  <div className="mt-6 flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-4 text-center justify-center text-xs">
                    <button
                      onClick={() => {
                        setFormMode('register');
                        setError('');
                      }}
                      className="text-[#f23030] hover:underline"
                    >
                      Don't have an account? Register
                    </button>
                    <button
                      onClick={() => {
                        setFormMode('reset');
                        setError('');
                      }}
                      className="text-[#aaaaaa] hover:text-[#f23030] hover:underline"
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
                  <h2 className="text-2xl font-bold text-[#f1f1f1] mb-2">Create Account</h2>
                  <p className="text-sm text-[#aaaaaa] mb-6">Join ClipSesh to rate and submit clips</p>
                  
                  {error && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-sm">
                      {error}
                    </div>
                  )}
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <label htmlFor="register-username" className="block text-xs font-semibold uppercase tracking-wider text-[#aaaaaa]">
                        Username
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                          <FaUser className="text-[#717171]" size={14} />
                        </div>
                        <input
                          id="register-username"
                          type="text"
                          name="username"
                          placeholder="Choose a username"
                          value={formData.username}
                          onChange={handleChange}
                          maxLength={30}
                          className="bg-[#121212] border border-[#262626] text-white focus:border-[#f23030] rounded-xl pl-10 pr-4 py-2.5 w-full text-sm outline-none transition-colors"
                          required
                        />
                        {formData.username.length > 0 && (
                          <div className={`absolute bottom-2.5 right-2.5 text-xs px-1.5 py-0.5 rounded bg-[#222222] ${formData.username.length === 30 ? 'text-red-400' : 'text-[#717171]'
                            }`}>
                            {formData.username.length}/30
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="register-password" className="block text-xs font-semibold uppercase tracking-wider text-[#aaaaaa]">
                        Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                          <FaLock className="text-[#717171]" size={14} />
                        </div>
                        <input
                          id="register-password"
                          type="password"
                          name="password"
                          placeholder="Create a strong password"
                          value={formData.password}
                          onChange={handleChange}
                          className="bg-[#121212] border border-[#262626] text-white focus:border-[#f23030] rounded-xl pl-10 pr-4 py-2.5 w-full text-sm outline-none transition-colors"
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-[#f23030] hover:bg-[#d92222] text-white w-full py-2.5 rounded-full font-semibold shadow-md shadow-[#f23030]/20 flex items-center justify-center text-sm transition-all"
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
                        <div className="w-full border-t border-[#262626]"></div>
                      </div>
                      <div className="relative flex justify-center">
                        <span className="px-2 bg-[#181818] text-xs text-[#717171]">
                          or register with
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleDiscordLogin}
                      className="w-full flex items-center justify-center gap-2 bg-[#5865F2] hover:bg-[#4752C4] text-white py-2.5 rounded-full transition duration-150 text-sm font-medium shadow-sm"
                    >
                      <FaDiscord size={18} />
                      Register with Discord
                    </button>
                  </form>

                  <div className="mt-6 text-center text-xs">
                    <button
                      onClick={() => {
                        setFormMode('login');
                        setError('');
                      }}
                      className="text-[#f23030] hover:underline"
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
                  <h2 className="text-2xl font-bold text-[#f1f1f1] mb-2">Reset Password</h2>
                  <p className="mb-6 text-[#aaaaaa] text-sm">
                    Enter your email address and we'll send you instructions to reset your password.
                  </p>

                  {resetMessage.type && (
                    <div className={`mb-4 p-3 rounded-xl text-sm ${resetMessage.type === 'success'
                      ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                      : 'bg-red-500/10 border border-red-500/30 text-red-400'
                      }`}>
                      {resetMessage.message}
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label htmlFor="reset-email" className="block text-xs font-semibold uppercase tracking-wider text-[#aaaaaa]">
                        Email Address
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                          <FaEnvelope className="text-[#717171]" size={14} />
                        </div>
                        <input
                          id="reset-email"
                          type="email"
                          placeholder="Enter your email"
                          value={email}
                          onChange={handleEmailChange}
                          className="bg-[#121212] border border-[#262626] text-white focus:border-[#f23030] rounded-xl pl-10 pr-4 py-2.5 w-full text-sm outline-none transition-colors"
                        />
                      </div>
                    </div>

                    <button
                      onClick={handlePasswordReset}
                      disabled={awaitingReset || !email.trim()}
                      className="bg-[#f23030] hover:bg-[#d92222] text-white w-full py-2.5 rounded-full font-semibold shadow-md shadow-[#f23030]/20 flex items-center justify-center text-sm disabled:opacity-50 transition-all"
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

                  <div className="mt-6 text-center text-xs">
                    <button
                      onClick={() => {
                        setFormMode('login');
                        setResetMessage({ type: '', message: '' });
                      }}
                      className="text-[#f23030] hover:underline"
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
