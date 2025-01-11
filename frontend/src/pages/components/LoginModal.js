import React, { useState } from 'react';
import axios from 'axios';
import apiUrl from '../../config/config';
import { TbLoader2 } from "react-icons/tb";
import { FaDiscord, FaTimes } from "react-icons/fa";

const LoginModal = ({ setIsLoginModalOpen, isLoginModalOpen, fetchUser }) => {
  const [formMode, setFormMode] = useState('login');
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [email, setEmail] = useState('');
  const [resetMessage, setResetMessage] = useState({type : '', message : ''});
  const [awaitingReset, setAwaitingReset] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  const handleLoginClickOutside = (event) => {
    if (event.target.className.includes('login-modal-overlay')) {
      const modalContent = document.querySelector('.modal-content');
      const modalOverlay = document.querySelector('.login-modal-overlay');
      modalContent.style.transition = 'transform 600ms';
      modalContent.style.transform = 'scale(0)';
      modalOverlay.style.transition = 'opacity 200ms';
      modalOverlay.style.opacity = '0';
      setTimeout(() => setIsLoginModalOpen(false), 200);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url =
      formMode === 'register'
        ? `${apiUrl}/api/users/register`
        : `${apiUrl}/api/users/login`;
    try {
      const response = await axios.post(url, formData);
      if (formMode === 'register') {
        alert('Registration successful! Please login.');
        setFormMode('login');
      } else {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('username', response.data.username);
        setIsLoginModalOpen(false);
        fetchUser();
        window.location.reload();
      }
    } catch (error) {
      console.error('Error:', error);
      if (error.response) {
        if (error.response.status === 403) alert('Account awaiting admin approval.');
        else if (error.response.status === 400) alert('Invalid username or password.');
        else alert('Submission failed. Please try again.');
      } else {
        alert('Submission failed. Please try again.');
      }
    }
  };

  const handlePasswordReset = async () => {
    try {
      setAwaitingReset(true);
      await axios.post(`${apiUrl}/api/users/resetPassword`, { email });
      setResetMessage({ type: 'success', message: `Password reset. Check your email at ${email}.` });
      setAwaitingReset(false);
    } catch (error) {
      if (error.response && error.response.status === 404) {
        setResetMessage({ type: 'error', message: 'Email not found. Please try again.' });
      } else if (error.response && error.response.status === 400) {
        setResetMessage({ type: 'error', message: 'Please fill in your email.' });
      } else {
        setResetMessage({ type: 'error', message: 'Failed to reset password. Please try again.' });
      }
      setAwaitingReset(false);
    }
  };

  const handleDiscordLogin = () => {
    window.location.href = `${apiUrl}/api/discord/auth`;
  };

  return (
    <>
      {isLoginModalOpen && (
        <div
          className="login-modal-overlay fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 ml-0"
          onClick={handleLoginClickOutside}
        >
          <div className="modal-content relative md:rounded-3xl justify-center items-center animate-jump-in bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white">
            <div className="min-w-[100vw] h-[100vh] md:h-auto md:min-w-px backdrop-blur-lg p-10 md:rounded-3xl shadow-md flex flex-col items-center justify-center md:block transition-transform duration-200">
              <button
                onClick={() => setIsLoginModalOpen(false)}
                className="absolute top-4 right-4 text-3xl text-neutral-900 dark:text-white hover:text-red-500 transition duration-200"
              >
                <FaTimes />
              </button>
              {formMode === 'login' && (
                <>
                  <h2 className="text-5xl md:text-3xl font-bold mb-4">Login</h2>
                  <form onSubmit={handleSubmit} className="w-full">
                    <div className="mb-4">
                      <input
                        type="text"
                        name="username"
                        placeholder="Username"
                        value={formData.username}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-neutral-200 dark:bg-neutral-900 dark:text-white text-neutral-900 rounded-md focus:outline-none focus:bg-neutral-300 dark:focus:bg-neutral-700"
                        required
                      />
                    </div>
                    <div className="mb-4">
                      <input
                        type="password"
                        name="password"
                        placeholder="Password"
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-neutral-200 dark:bg-neutral-900 dark:text-white text-neutral-900 rounded-md focus:outline-none focus:bg-neutral-300 dark:focus:bg-neutral-700"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-md transition duration-200"
                    >
                      Login
                    </button>
                    <div className="mt-4 text-center">
                      <button
                        onClick={handleDiscordLogin}
                        className="flex items-center justify-center w-full bg-blurple hover:bg-blurple-dark text-white py-2 rounded-md transition duration-200"
                      >
                        <FaDiscord className="mr-1" /> Login with Discord
                      </button>
                    </div>
                  </form>
                  <div className="mt-4 flex flex-col md:flex-row md:space-x-16 text-center justify-center items-center">
                    <button
                      onClick={() => setFormMode('register')}
                      className="text-blue-500 hover:underline"
                    >
                      Don’t have an account? Register
                    </button>
                    <button
                      onClick={() => setFormMode('reset')}
                      className="text-red-500 hover:underline"
                    >
                      Forgot your password?
                    </button>
                  </div>
                </>
              )}

              {formMode === 'register' && (
                <>
                  <h2 className="text-3xl font-bold mb-4">Register</h2>
                  <form onSubmit={handleSubmit}>
                    <div className="relative mb-4">
                      <input
                        type="text"
                        name="username"
                        placeholder="Username"
                        value={formData.username}
                        onChange={handleChange}
                        maxLength={30}
                        className="w-full px-3 py-2 bg-neutral-200 dark:bg-neutral-900 dark:text-white text-neutral-900 rounded-md"
                        required
                      />
                      {formData.username.length > 0 && (
                        <p
                          className={`absolute bottom-1 right-1 bg-white/10 rounded-md backdrop-blur-md p-1 ${formData.username.length === 30
                              ? 'text-red-500'
                              : 'text-neutral-300'
                            }`}
                        >
                          {formData.username.length}/30
                        </p>
                      )}
                    </div>
                    <div className="mb-4">
                      <input
                        type="password"
                        name="password"
                        placeholder="Password"
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-neutral-200 dark:bg-neutral-900 dark:text-white text-neutral-900 rounded-md transition duration-200"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-md"
                    >
                      Register
                    </button>
                    <div className="mt-4 text-center">
                      <button
                        onClick={handleDiscordLogin}
                        className="flex items-center justify-center w-full bg-blurple hover:bg-blurple-dark text-white py-2 rounded-md transition duration-200"
                      >
                        <FaDiscord className="mr-1" /> Register with Discord
                      </button>
                    </div>
                  </form>
                  <div className="mt-4 text-center">
                    <button
                      onClick={() => setFormMode('login')}
                      className="text-blue-500 hover:underline"
                    >
                      Already have an account? Login
                    </button>
                  </div>
                </>
              )}

              {formMode === 'reset' && (
                <>
                  <h2 className="text-3xl font-bold mb-4">Reset Password</h2>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={handleEmailChange}
                    className="w-full px-3 py-2 bg-neutral-200 dark:bg-neutral-900 dark:text-white text-neutral-900 rounded-md"
                  />
                  <button
                    onClick={handlePasswordReset}
                    className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-md mt-4 transition duration-200"
                  >
                    Reset Password
                  </button>
                  {awaitingReset && (
                    <div className="flex justify-center items-center mt-4">
                      <TbLoader2 className="animate-spin text-4xl" />
                    </div>
                  )}
                  {resetMessage && <p className={`mt-2 ${resetMessage.type === "error" ? "text-red-400" : resetMessage.type === "success" ? "text-green-400" : "text-neutral-300"} `}>{resetMessage.message}</p>}
                  <div className="mt-4 text-center">
                    <button
                      onClick={() => setFormMode('login')}
                      className="text-blue-500 hover:underline"
                    >
                      Back to Login
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LoginModal;
