import React from 'react';
import { useState } from 'react';
import axios from 'axios';

const CreateUser = ({ fetchUsers, apiUrl, AVAILABLE_ROLES }) => {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        roles: []
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (type === 'checkbox') {
            setFormData(prev => ({
                ...prev,
                roles: checked
                    ? [...prev.roles, value]
                    : prev.roles.filter(role => role !== value)
            }));
        } else {
            setFormData({
                ...formData,
                [name]: value
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${apiUrl}/api/admin/create-user`, { ...formData, status: 'active' }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('User created successfully');
            setFormData({ username: '', password: '', roles: [] });
            fetchUsers();
        } catch (error) {
            console.error('Error creating user:', error);
            alert('Failed to create user. Please try again.');
        }
    };

    return (
        <div className="col-span-1 min-w-full w-full bg-neutral-300 dark:bg-neutral-800 text-neutral-900 dark:text-white transition duration-200 p-8 rounded-md shadow-md animate-fade animate-delay-200">
            <h2 className="text-3xl font-bold mb-4">Create User</h2>
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label htmlFor="username" className="block text-neutral-900 dark:text-gray-300">Username:</label>
                    <input
                        type="text"
                        id="username"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-white dark:bg-neutral-900 dark:text-white text-neutral-900 rounded-md focus:outline-none focus:bg-neutral-200 dark:focus:bg-neutral-700"
                        required
                    />
                </div>
                <div className="mb-4">
                    <label htmlFor="password" className="block text-neutral-900 dark:text-gray-300">Password:</label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-white dark:bg-neutral-900 dark:text-white text-neutral-900 rounded-md focus:outline-none focus:bg-neutral-200 dark:focus:bg-neutral-700"
                        required
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-neutral-900 dark:text-gray-300">Roles:</label>
                    <ul>
                        {[...AVAILABLE_ROLES].sort().map(role => (
                            <li key={role} className="inline-flex items-center mr-4">
                                <input
                                    type="checkbox"
                                    name="roles"
                                    value={role}
                                    checked={formData.roles.includes(role)}
                                    onChange={handleChange}
                                    className="form-checkbox h-5 w-5 text-blue-600"
                                />
                                <span className="ml-2 text-white">{role.charAt(0).toUpperCase() + role.slice(1)}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                <button
                    type="submit"
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-md focus:outline-none focus:bg-blue-600"
                >
                    Create User
                </button>
            </form>
        </div>
    );
}

export default CreateUser;
