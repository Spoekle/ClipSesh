'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaUser, FaLock, FaUserPlus, FaShieldAlt, FaEnvelope, FaExclamationTriangle } from 'react-icons/fa';
import { useNotification } from '@/context/AlertContext';
import { CreateUserFormData, FormErrors } from '@/types/adminTypes';
import { useCreateUser } from '@/hooks/useAdmin';
import { Button } from '@/components/Button';

interface CreateUserProps {
    fetchUsers?: () => void;
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
        } catch (error: unknown) {
            console.error('Error creating user:', error);
            const msg = error instanceof Error ? error.message : 'Failed to create user';
            showError(msg);
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
            className="w-full bg-cc-card text-foreground p-6 rounded-2xl border border-border"
        >
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                    <FaUserPlus size={14} />
                </div>
                <div>
                    <h2 className="text-base font-bold text-foreground">Create User</h2>
                    <p className="text-xs text-muted-foreground">Provision a new user account with role permissions</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Username field */}
                <div className="flex flex-col">
                    <label htmlFor="username" className="mb-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center">
                        <FaUser className="mr-1.5 text-muted-foreground" /> Username <span className="text-cc-red ml-1">*</span>
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            id="username"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            className={`w-full pl-9 pr-3.5 py-2 bg-cc-ground border rounded-xl text-xs text-foreground focus:outline-none ${
                                errors.username ? 'border-cc-red' : 'border-border focus:border-border'
                            }`}
                            placeholder="Enter username"
                        />
                        <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs" />
                    </div>
                    {errors.username && (
                        <div className="text-cc-red text-[11px] mt-1 flex items-center font-medium">
                            <FaExclamationTriangle className="mr-1" /> {errors.username}
                        </div>
                    )}
                </div>

                {/* Email field */}
                <div className="flex flex-col">
                    <label htmlFor="email" className="mb-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center">
                        <FaEnvelope className="mr-1.5 text-muted-foreground" /> Email Address:
                    </label>
                    <div className="relative">
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className={`w-full pl-9 pr-3.5 py-2 bg-cc-ground border rounded-xl text-xs text-foreground focus:outline-none ${
                                errors.email ? 'border-cc-red' : 'border-border focus:border-border'
                            }`}
                            placeholder="user@example.com"
                        />
                        <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs" />
                    </div>
                    {errors.email && (
                        <div className="text-cc-red text-[11px] mt-1 flex items-center font-medium">
                            <FaExclamationTriangle className="mr-1" /> {errors.email}
                        </div>
                    )}
                </div>

                {/* Password field */}
                <div className="flex flex-col">
                    <label htmlFor="password" className="mb-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center">
                        <FaLock className="mr-1.5 text-muted-foreground" /> Password <span className="text-cc-red ml-1">*</span>
                    </label>
                    <div className="relative">
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className={`w-full pl-9 pr-3.5 py-2 bg-cc-ground border rounded-xl text-xs text-foreground focus:outline-none ${
                                errors.password ? 'border-cc-red' : 'border-border focus:border-border'
                            }`}
                            placeholder="Enter password"
                        />
                        <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs" />
                    </div>
                    {errors.password && (
                        <div className="text-cc-red text-[11px] mt-1 flex items-center font-medium">
                            <FaExclamationTriangle className="mr-1" /> {errors.password}
                        </div>
                    )}

                    {/* Password strength indicator */}
                    {formData.password && (
                        <div className="mt-2 bg-cc-ground p-2.5 rounded-xl border border-border">
                            <div className="flex justify-between items-center text-[11px] mb-1">
                                <span className="text-muted-foreground">Strength:</span>
                                <span className="font-semibold text-foreground">{getStrengthLabel()}</span>
                            </div>
                            <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-300 ${
                                        passwordStrength <= 1
                                            ? 'bg-cc-red'
                                            : passwordStrength === 2
                                                ? 'bg-yellow-500'
                                                : 'bg-emerald-500'
                                    }`}
                                    style={{ width: `${(passwordStrength / 4) * 100}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Roles selection */}
                <div className="flex flex-col">
                    <label className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center">
                        <FaShieldAlt className="mr-1.5 text-muted-foreground" /> Assigned Roles <span className="text-cc-red ml-1">*</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {AVAILABLE_ROLES.map((role) => (
                            <label
                                key={role}
                                className={`flex items-center p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                                    formData.roles.includes(role)
                                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                                        : 'bg-cc-ground border-border text-muted-foreground hover:border-border'
                                }`}
                            >
                                <input
                                    type="checkbox"
                                    name="roles"
                                    value={role}
                                    checked={formData.roles.includes(role)}
                                    onChange={handleChange}
                                    className="mr-2 rounded text-emerald-500 focus:ring-0 bg-cc-ground border-border"
                                />
                                {role.charAt(0).toUpperCase() + role.slice(1)}
                            </label>
                        ))}
                    </div>
                    {errors.roles && (
                        <div className="text-cc-red text-[11px] mt-1 flex items-center font-medium">
                            <FaExclamationTriangle className="mr-1" /> {errors.roles}
                        </div>
                    )}
                </div>

                {/* Submit button */}
                <Button
                    type="submit"
                    variant="success"
                    size="md"
                    fullWidth
                    isLoading={isSubmitting}
                    leftIcon={<FaUserPlus />}
                >
                    {isSubmitting ? 'Creating user...' : 'Create User'}
                </Button>
            </form>
        </motion.div>
    );
};

export default CreateUser;
