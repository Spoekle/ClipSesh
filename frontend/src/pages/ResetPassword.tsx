import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import apiUrl from '../config/config';
import background from '../media/editor.webp';
import { motion } from 'framer-motion';
import { FaLock, FaShieldAlt, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';
import { useNotification } from '../context/NotificationContext';

const ResetPassword: React.FC = () => {
    const [password, setPassword] = useState<string>('');
    const [confirmPassword, setConfirmPassword] = useState<string>('');
    const [message, setMessage] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [passwordStrength, setPasswordStrength] = useState<number>(0);
    
    // Use notification context
    const { showSuccess, showError } = useNotification();
    
    const location = useLocation();
    const navigate = useNavigate();

    const query = new URLSearchParams(location.search);
    const token = query.get('token');

    useEffect(() => {
        if (!token) {
            showError('Invalid or missing token');
            navigate('/clips');
        }
    }, [token, navigate, showError]);

    const checkPasswordStrength = (password: string): number => {
        let strength = 0;
        if (password.length >= 8) strength += 1;
        if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength += 1;
        if (password.match(/[0-9]/)) strength += 1;
        if (password.match(/[^a-zA-Z0-9]/)) strength += 1;
        return strength;
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const newPassword = e.target.value;
        setPassword(newPassword);
        setPasswordStrength(checkPasswordStrength(newPassword));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (passwordStrength < 2) {
            setError('Password is too weak. Include uppercase, lowercase, numbers, or special characters.');
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post(`${apiUrl}/api/users/resetPassword/confirm`, { token, password });
            setMessage(response.data.message);
            setError('');
            showSuccess('Password reset successful! Redirecting...');
            setTimeout(() => {
                navigate('/');
            }, 2000);
        } catch (err: any) {
            const errorMsg = err.response?.data?.error || 'An error occurred';
            setError(errorMsg);
            showError(errorMsg);
            setMessage('');
        } finally {
            setLoading(false);
        }
    };

    const getStrengthClass = (): string => {
        switch (passwordStrength) {
            case 0: return 'bg-red-500';
            case 1: return 'bg-orange-500';
            case 2: return 'bg-yellow-500';
            case 3: return 'bg-blue-500';
            case 4: return 'bg-green-500';
            default: return 'bg-gray-300';
        }
    };

    const getStrengthText = (): string => {
        switch (passwordStrength) {
            case 0: return 'Very weak';
            case 1: return 'Weak';
            case 2: return 'Medium';
            case 3: return 'Strong';
            case 4: return 'Very strong';
            default: return '';
        }
    };

    return (
        <div className="min-h-screen text-white flex flex-col items-center bg-neutral-200 dark:bg-neutral-900 transition duration-200">
            <Helmet>
                <title>Reset Password | ClipSesh</title>
                <meta
                    name="description"
                    content="Reset your password to regain access to your ClipSesh account"
                />
            </Helmet>
            <div
                className="w-full flex h-96 justify-center items-center animate-fade"
                style={{ backgroundImage: `url(${background})`, backgroundSize: 'cover', backgroundPosition: 'center', clipPath: 'polygon(0 0, 100% 0, 100% 80%, 0 100%)' }}
            >
                <div className="flex bg-gradient-to-b from-neutral-900/80 to-bg-black/40 backdrop-blur-md justify-center items-center w-full h-full">
                    <div className="flex flex-col justify-center items-center px-4 md:px-0">
                        <motion.h1 
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="text-4xl md:text-5xl font-bold mb-4 text-center text-white drop-shadow-lg"
                        >
                            Reset Password
                        </motion.h1>
                        <motion.h1 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="text-2xl md:text-3xl mb-4 text-center text-white/90 drop-shadow-md"
                        >
                            It happens to the best of us...
                        </motion.h1>
                    </div>
                </div>
            </div>

            <div className="container max-w-md px-4 pt-16 pb-12 bg-neutral-200 dark:bg-neutral-900 transition duration-200 justify-center justify-items-center">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="w-full p-6 md:p-8 bg-neutral-300 dark:bg-neutral-800 text-neutral-900 dark:text-white transition duration-200 rounded-xl shadow-lg"
                >
                    {message && (
                        <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mb-6 p-4 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200 rounded-lg flex items-center"
                        >
                            <FaCheckCircle className="h-5 w-5 mr-2" />
                            {message}
                        </motion.div>
                    )}
                    
                    {error && (
                        <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mb-6 p-4 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200 rounded-lg flex items-center"
                        >
                            <FaExclamationTriangle className="h-5 w-5 mr-2" />
                            {error}
                        </motion.div>
                    )}
                    
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="flex flex-col">
                            <label className="mb-2 font-medium text-neutral-800 dark:text-gray-200 flex items-center">
                                <FaLock className="mr-2" /> New Password:
                            </label>
                            <div className="relative">
                                <input
                                    type="password"
                                    value={password}
                                    onChange={handlePasswordChange}
                                    required
                                    className="p-3 pl-10 w-full rounded-lg bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white border border-neutral-400 dark:border-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                                    placeholder="Enter a strong password"
                                />
                                <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-500 dark:text-neutral-400" />
                            </div>
                            
                            {password && (
                                <div className="mt-2">
                                    <div className="flex justify-between mb-1">
                                        <div className="text-sm font-medium flex items-center">
                                            <FaShieldAlt className="mr-1" /> {getStrengthText()}
                                        </div>
                                    </div>
                                    <div className="h-2 w-full bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${passwordStrength * 25}%` }}
                                            transition={{ duration: 0.3 }}
                                            className={`h-full ${getStrengthClass()}`}>
                                        </motion.div>
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <div className="flex flex-col">
                            <label className="mb-2 font-medium text-neutral-800 dark:text-gray-200 flex items-center">
                                <FaLock className="mr-2" /> Confirm Password:
                            </label>
                            <div className="relative">
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    className="p-3 pl-10 w-full rounded-lg bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white border border-neutral-400 dark:border-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                                    placeholder="Confirm your password"
                                />
                                <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-500 dark:text-neutral-400" />
                            </div>
                            {password && confirmPassword && password !== confirmPassword && (
                                <motion.p 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="mt-1 text-sm text-red-500 flex items-center"
                                >
                                    <FaExclamationTriangle className="mr-1" /> Passwords do not match
                                </motion.p>
                            )}
                        </div>
                        
                        <motion.button
                            type="submit"
                            disabled={loading}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-200 flex justify-center items-center"
                        >
                            {loading ? (
                                <span className="inline-block animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></span>
                            ) : (
                                'Reset Password'
                            )}
                        </motion.button>
                    </form>
                </motion.div>
            </div>
        </div>
    );
};

export default ResetPassword;