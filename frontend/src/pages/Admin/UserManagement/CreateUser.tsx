import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaUser, FaLock, FaUserPlus, FaShieldAlt, FaCheck, FaEnvelope, FaExclamationTriangle } from 'react-icons/fa';
import { useNotification } from '../../../context/AlertContext';
import { CreateUserFormData, FormErrors } from '../../../types/adminTypes';

import { useCreateUser } from '../../../hooks/useAdmin';

interface CreateUserProps {
  fetchUsers: () => void;
  AVAILABLE_ROLES: string[];
}

const CreateUser: React.FC<CreateUserProps> = ({ AVAILABLE_ROLES }) => {
    const [formData, setFormData] = useState<CreateUserFormData>({
        username: '',
        password: '',
        email: '',
        roles: ['user']
    });
    const [errors, setErrors] = useState<FormErrors>({});
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [passwordStrength, setPasswordStrength] = useState<number>(0);
    
    const { showSuccess, showError } = useNotification();
    const createUserMutation = useCreateUser();
    
    const checkPasswordStrength = (password: string): number => {
        let strength = 0;
        if (password.length >= 8) strength += 1;
        if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength += 1;
        if (password.match(/[0-9]/)) strength += 1;
        if (password.match(/[^a-zA-Z0-9]/)) strength += 1;
        return strength;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        
        if (type === 'checkbox') {
            setFormData(prev => {
                const newRoles = checked
                    ? [...prev.roles, value]
                    : prev.roles.filter(role => role !== value);
                
                return {
                    ...prev,
                    roles: newRoles.length ? newRoles : prev.roles
                };
            });
        } else {
            setFormData({
                ...formData,
                [name]: value
            });
            
            if (errors[name as keyof FormErrors]) {
                setErrors({
                    ...errors,
                    [name]: undefined
                });
            }
            
            if (name === 'password') {
                setPasswordStrength(checkPasswordStrength(value));
            }
        }
    };

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};
        
        if (!formData.username.trim()) {
            newErrors.username = 'Username is required';
        } else if (formData.username.length < 3) {
            newErrors.username = 'Username must be at least 3 characters';
        }
        
        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (passwordStrength < 2) {
            newErrors.password = 'Password is too weak';
        }
        
        if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email is invalid';
        }
        
        if (formData.roles.length === 0) {
            newErrors.roles = 'At least one role is required';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }
          setIsSubmitting(true);
        try {
            await createUserMutation.mutateAsync({ ...formData, status: 'active' });
            
            showSuccess('User created successfully!');
            setFormData({ username: '', password: '', email: '', roles: ['user'] });
            setPasswordStrength(0);
        } catch (error: any) {
            console.error('Error creating user:', error);
            const errorMessage = error.response?.data?.message || 'Failed to create user';
            showError(errorMessage);
            
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            }
        } finally {
            setIsSubmitting(false);
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
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="col-span-1 w-full bg-neutral-300 dark:bg-neutral-800 text-neutral-900 dark:text-white transition duration-200 p-6 md:p-8 rounded-xl shadow-lg hover:shadow-xl"
        >
            <h2 className="text-2xl md:text-3xl font-bold mb-6 border-b pb-3 border-neutral-400 dark:border-neutral-700 flex items-center">
                <FaUserPlus className="mr-3 text-blue-500" /> 
                Create User
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Username field */}
                <div className="flex flex-col">
                    <label htmlFor="username" className="mb-2 font-medium text-neutral-800 dark:text-gray-200 flex items-center">
                        <FaUser className="mr-2" /> Username:
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            id="username"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            className={`p-3 pl-10 w-full rounded-lg ${errors.username ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-neutral-400 dark:border-neutral-600 bg-white dark:bg-neutral-700'} text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200`}
                            placeholder="Enter username"
                        />
                        <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-500 dark:text-neutral-400" />
                    </div>
                    {errors.username && (
                        <div className="text-red-500 text-sm mt-1 flex items-center">
                            <FaExclamationTriangle className="mr-1" /> {errors.username}
                        </div>
                    )}
                </div>

                {/* Email field */}
                <div className="flex flex-col">
                    <label htmlFor="email" className="mb-2 font-medium text-neutral-800 dark:text-gray-200 flex items-center">
                        <FaEnvelope className="mr-2" /> Email: <span className="text-sm text-neutral-500 ml-1">(optional)</span>
                    </label>
                    <div className="relative">
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className={`p-3 pl-10 w-full rounded-lg ${errors.email ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-neutral-400 dark:border-neutral-600 bg-white dark:bg-neutral-700'} text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200`}
                            placeholder="Enter email (optional)"
                        />
                        <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-500 dark:text-neutral-400" />
                    </div>
                    {errors.email && (
                        <div className="text-red-500 text-sm mt-1 flex items-center">
                            <FaExclamationTriangle className="mr-1" /> {errors.email}
                        </div>
                    )}
                </div>

                {/* Password field */}
                <div className="flex flex-col">
                    <label htmlFor="password" className="mb-2 font-medium text-neutral-800 dark:text-gray-200 flex items-center">
                        <FaLock className="mr-2" /> Password:
                    </label>
                    <div className="relative">
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className={`p-3 pl-10 w-full rounded-lg ${errors.password ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-neutral-400 dark:border-neutral-600 bg-white dark:bg-neutral-700'} text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200`}
                            placeholder="Enter a strong password"
                        />
                        <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-500 dark:text-neutral-400" />
                    </div>
                    {errors.password && (
                        <div className="text-red-500 text-sm mt-1 flex items-center">
                            <FaExclamationTriangle className="mr-1" /> {errors.password}
                        </div>
                    )}
                    
                    {/* Password strength indicator */}
                    {formData.password && (
                        <div className="mt-2">
                            <div className="flex justify-between mb-1 items-center">
                                <div className="text-sm font-medium flex items-center text-neutral-700 dark:text-neutral-300">
                                    <FaShieldAlt className={`mr-1 ${
                                        passwordStrength <= 1 ? 'text-red-500' : 
                                        passwordStrength === 2 ? 'text-yellow-500' : 
                                        passwordStrength === 3 ? 'text-blue-500' : 
                                        'text-green-500'
                                    }`} /> 
                                    Password strength: {getStrengthText()}
                                </div>
                            </div>
                            <div className="h-1.5 w-full bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${passwordStrength * 25}%` }}
                                    transition={{ duration: 0.3 }}
                                    className={`h-full ${getStrengthClass()}`}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Roles selection */}
                <div className="flex flex-col">
                    <label className="mb-2 font-medium text-neutral-800 dark:text-gray-200 flex items-center">
                        <FaShieldAlt className="mr-2" /> Roles:
                    </label>
                    <div className="bg-neutral-200 dark:bg-neutral-700 p-4 rounded-lg grid grid-cols-2 md:grid-cols-3 gap-3">
                        {[...AVAILABLE_ROLES].sort().map(role => (
                            <label key={role} className="flex items-center space-x-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="roles"
                                    value={role}
                                    checked={formData.roles.includes(role)}
                                    onChange={handleChange}
                                    className="hidden"
                                    disabled={formData.roles.length === 1 && formData.roles.includes(role)}
                                />
                                <div className={`w-5 h-5 rounded flex items-center justify-center ${
                                    formData.roles.includes(role) 
                                        ? 'bg-blue-600 text-white' 
                                        : 'bg-neutral-300 dark:bg-neutral-600'
                                }`}>
                                    {formData.roles.includes(role) && <FaCheck className="text-xs" />}
                                </div>
                                <span className="capitalize">{role}</span>
                            </label>
                        ))}
                    </div>
                    {errors.roles && (
                        <div className="text-red-500 text-sm mt-1 flex items-center">
                            <FaExclamationTriangle className="mr-1" /> {errors.roles}
                        </div>
                    )}
                </div>

                {/* Submit button */}
                <motion.button
                    type="submit"
                    disabled={isSubmitting}
                    whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                    whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                    className={`w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center ${
                        isSubmitting 
                            ? 'bg-neutral-500 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50'
                    } text-white transition duration-200`}
                >
                    {isSubmitting ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Creating user...
                        </>
                    ) : (
                        <>
                            <FaUserPlus className="mr-2" /> Create User
                        </>
                    )}
                </motion.button>
            </form>
        </motion.div>
    );
};

export default CreateUser;
