import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaUser, FaLock, FaUserPlus, FaShieldAlt, FaEnvelope, FaExclamationTriangle } from 'react-icons/fa';
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
        } else if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        if (formData.email && !formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            newErrors.email = 'Please enter a valid email address';
        }

        if (!formData.roles.length) {
            newErrors.roles = 'At least one role must be selected';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            await createUserMutation.mutateAsync({
                ...formData,
                status: 'active'
            });

            showSuccess(`User ${formData.username} created successfully`);
            setFormData({
                username: '',
                password: '',
                email: '',
                roles: ['user']
            });
            setPasswordStrength(0);
        } catch (error: any) {
            console.error('Error creating user:', error);
            showError(error.response?.data?.message || error.message || 'Failed to create user');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStrengthLabel = (): string => {
        switch (passwordStrength) {
            case 0: return 'Weak';
            case 1: return 'Weak';
            case 2: return 'Fair';
            case 3: return 'Good';
            case 4: return 'Very strong';
            default: return '';
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full bg-[#181818] text-[#f1f1f1] p-6 rounded-2xl border border-[#262626]"
        >
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#262626]">
                <div className="w-8 h-8 rounded-xl bg-[#22c55e]/15 text-[#22c55e] flex items-center justify-center">
                    <FaUserPlus size={14} />
                </div>
                <div>
                    <h2 className="text-base font-bold text-[#f1f1f1]">Create User</h2>
                    <p className="text-xs text-[#717171]">Provision a new user account with role permissions</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Username field */}
                <div className="flex flex-col">
                    <label htmlFor="username" className="mb-1.5 text-xs font-semibold text-[#aaaaaa] uppercase tracking-wider flex items-center">
                        <FaUser className="mr-1.5 text-[#717171]" /> Username <span className="text-[#f23030] ml-1">*</span>
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            id="username"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            className={`w-full pl-9 pr-3.5 py-2 bg-[#121212] border rounded-xl text-xs text-[#f1f1f1] focus:outline-none ${
                                errors.username ? 'border-[#f23030]' : 'border-[#262626] focus:border-[#444]'
                            }`}
                            placeholder="Enter username"
                        />
                        <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-[#717171] text-xs" />
                    </div>
                    {errors.username && (
                        <div className="text-[#f23030] text-[11px] mt-1 flex items-center font-medium">
                            <FaExclamationTriangle className="mr-1" /> {errors.username}
                        </div>
                    )}
                </div>

                {/* Email field */}
                <div className="flex flex-col">
                    <label htmlFor="email" className="mb-1.5 text-xs font-semibold text-[#aaaaaa] uppercase tracking-wider flex items-center">
                        <FaEnvelope className="mr-1.5 text-[#717171]" /> Email Address:
                    </label>
                    <div className="relative">
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className={`w-full pl-9 pr-3.5 py-2 bg-[#121212] border rounded-xl text-xs text-[#f1f1f1] focus:outline-none ${
                                errors.email ? 'border-[#f23030]' : 'border-[#262626] focus:border-[#444]'
                            }`}
                            placeholder="user@example.com"
                        />
                        <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-[#717171] text-xs" />
                    </div>
                    {errors.email && (
                        <div className="text-[#f23030] text-[11px] mt-1 flex items-center font-medium">
                            <FaExclamationTriangle className="mr-1" /> {errors.email}
                        </div>
                    )}
                </div>

                {/* Password field */}
                <div className="flex flex-col">
                    <label htmlFor="password" className="mb-1.5 text-xs font-semibold text-[#aaaaaa] uppercase tracking-wider flex items-center">
                        <FaLock className="mr-1.5 text-[#717171]" /> Password <span className="text-[#f23030] ml-1">*</span>
                    </label>
                    <div className="relative">
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className={`w-full pl-9 pr-3.5 py-2 bg-[#121212] border rounded-xl text-xs text-[#f1f1f1] focus:outline-none ${
                                errors.password ? 'border-[#f23030]' : 'border-[#262626] focus:border-[#444]'
                            }`}
                            placeholder="Enter password"
                        />
                        <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#717171] text-xs" />
                    </div>
                    {errors.password && (
                        <div className="text-[#f23030] text-[11px] mt-1 flex items-center font-medium">
                            <FaExclamationTriangle className="mr-1" /> {errors.password}
                        </div>
                    )}

                    {/* Password strength indicator */}
                    {formData.password && (
                        <div className="mt-2 bg-[#141414] p-2.5 rounded-xl border border-[#262626]">
                            <div className="flex justify-between items-center text-[11px] mb-1">
                                <span className="text-[#717171]">Strength:</span>
                                <span className="font-semibold text-[#f1f1f1]">{getStrengthLabel()}</span>
                            </div>
                            <div className="w-full bg-[#222222] h-1.5 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-300 ${
                                        passwordStrength <= 1
                                            ? 'bg-[#f23030]'
                                            : passwordStrength === 2
                                                ? 'bg-[#eab308]'
                                                : 'bg-[#22c55e]'
                                    }`}
                                    style={{ width: `${(passwordStrength / 4) * 100}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Roles selection */}
                <div className="flex flex-col">
                    <label className="mb-2 text-xs font-semibold text-[#aaaaaa] uppercase tracking-wider flex items-center">
                        <FaShieldAlt className="mr-1.5 text-[#717171]" /> Assigned Roles <span className="text-[#f23030] ml-1">*</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {AVAILABLE_ROLES.map((role) => (
                            <label
                                key={role}
                                className={`flex items-center p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                                    formData.roles.includes(role)
                                        ? 'bg-[#22c55e]/15 border-[#22c55e]/40 text-[#22c55e]'
                                        : 'bg-[#141414] border-[#262626] text-[#aaaaaa] hover:border-[#383838]'
                                }`}
                            >
                                <input
                                    type="checkbox"
                                    name="roles"
                                    value={role}
                                    checked={formData.roles.includes(role)}
                                    onChange={handleChange}
                                    className="mr-2 rounded text-[#22c55e] focus:ring-0 bg-[#121212] border-[#262626]"
                                />
                                {role.charAt(0).toUpperCase() + role.slice(1)}
                            </label>
                        ))}
                    </div>
                    {errors.roles && (
                        <div className="text-[#f23030] text-[11px] mt-1 flex items-center font-medium">
                            <FaExclamationTriangle className="mr-1" /> {errors.roles}
                        </div>
                    )}
                </div>

                {/* Submit button */}
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 rounded-xl font-semibold text-xs text-white bg-[#22c55e] hover:bg-[#16a34a] disabled:opacity-50 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                    {isSubmitting ? (
                        <>
                            <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
                            <span>Creating user...</span>
                        </>
                    ) : (
                        <>
                            <FaUserPlus />
                            <span>Create User</span>
                        </>
                    )}
                </button>
            </form>
        </motion.div>
    );
};

export default CreateUser;
