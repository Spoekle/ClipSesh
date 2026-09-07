import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from '@/lib/routerCompat';
import { motion } from 'framer-motion';
import { FaLock, FaShieldAlt, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';
import PageLayout from '../components/layouts/PageLayout';
import { useNotification } from '../context/AlertContext';
import { confirmPasswordReset } from '../services/userService';

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
        } setLoading(true);
        try {
            if (!token) throw new Error('Invalid token');
            const response = await confirmPasswordReset(token, password);
            setMessage(response.message || 'Password reset successful');
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
        <PageLayout
            title="Reset Password"
            subtitle="Enter your new password to regain access to your ClipSesh account"
            metaDescription="Reset your password to regain access to your ClipSesh account"
        >
            <div className="max-w-md mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-[#161d21] rounded-xl border border-[#263238] p-6 sm:p-8 shadow-xl text-white"
                >
                    {message && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mb-6 p-4 bg-green-500/10 border border-green-500/30 text-green-300 rounded-[10px] flex items-center text-sm"
                        >
                            <FaCheckCircle className="h-5 w-5 mr-2 shrink-0 text-green-400" />
                            <span>{message}</span>
                        </motion.div>
                    )}

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-red-300 rounded-[10px] flex items-center text-sm"
                        >
                            <FaExclamationTriangle className="h-5 w-5 mr-2 shrink-0 text-[#f23030]" />
                            <span>{error}</span>
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="flex flex-col">
                            <label className="mb-2 font-medium text-xs text-[#8b98a5] uppercase tracking-wider flex items-center">
                                <FaLock className="mr-2 text-[#f23030]" /> New Password
                            </label>
                            <div className="relative">
                                <input
                                    type="password"
                                    value={password}
                                    onChange={handlePasswordChange}
                                    required
                                    className="bg-[#0e1315] border border-[#263238] focus:border-[#f23030] focus:ring-1 focus:ring-[#f23030] rounded-[8px] pl-10 pr-4 py-2.5 w-full text-sm text-white placeholder-[#626262] outline-none transition-colors"
                                    placeholder="Enter a strong password"
                                />
                                <FaLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#626262]" size={14} />
                            </div>

                            {password && (
                                <div className="mt-3">
                                    <div className="flex justify-between mb-1 text-xs">
                                        <div className="font-medium flex items-center text-[#8b98a5]">
                                            <FaShieldAlt className="mr-1 text-[#f23030]" /> Strength: {getStrengthText()}
                                        </div>
                                    </div>
                                    <div className="h-2 w-full bg-[#0e1315] rounded-full overflow-hidden border border-[#263238]">
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
                            <label className="mb-2 font-medium text-xs text-[#8b98a5] uppercase tracking-wider flex items-center">
                                <FaLock className="mr-2 text-[#f23030]" /> Confirm Password
                            </label>
                            <div className="relative">
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    className="bg-[#0e1315] border border-[#263238] focus:border-[#f23030] focus:ring-1 focus:ring-[#f23030] rounded-[8px] pl-10 pr-4 py-2.5 w-full text-sm text-white placeholder-[#626262] outline-none transition-colors"
                                    placeholder="Confirm your password"
                                />
                                <FaLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#626262]" size={14} />
                            </div>
                            {password && confirmPassword && password !== confirmPassword && (
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="mt-1.5 text-xs text-[#f23030] flex items-center"
                                >
                                    <FaExclamationTriangle className="mr-1" /> Passwords do not match
                                </motion.p>
                            )}
                        </div>

                        <motion.button
                            type="submit"
                            disabled={loading}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            className="btn btn-primary w-full py-3 rounded-[8px] font-semibold flex justify-center items-center shadow-lg shadow-[#f23030]/20"
                        >
                            {loading ? (
                                <span className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-white/20 border-t-white"></span>
                            ) : (
                                'Reset Password'
                            )}
                        </motion.button>
                    </form>
                </motion.div>
            </div>
        </PageLayout>
    );
};

export default ResetPassword;