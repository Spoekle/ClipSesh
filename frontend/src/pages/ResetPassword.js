import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import apiUrl from '../config/config';
import background from '../media/editor.webp';

const ResetPassword = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const location = useLocation();
    const navigate = useNavigate();

    const query = new URLSearchParams(location.search);
    const token = query.get('token');

    useEffect(() => {
        if (!token) {
            navigate('/clips');
        }
    }, [token, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        try {
            const response = await axios.post(`${apiUrl}/api/users/resetPassword/confirm`, { token, password });
            setMessage(response.data.message);
            setError('');
            setTimeout(() => {
            navigate('/');
            } , 2000);
        } catch (err) {
            setError(err.response?.data?.error || 'An error occurred');
            setMessage('');
        }
    };

    return (
        <div className="min-h-screen text-white flex flex-col items-center bg-neutral-200 dark:bg-neutral-900 transition duration-200">
            <Helmet>
                <title>Editor Dash</title>
                <meta
                    name="description"
                    description="ClipSesh! is a site for Beat Saber players by Beat Saber players. On this site you will be able to view all submitted clips"
                />
            </Helmet>
            <div
                className="w-full flex h-96 justify-center items-center animate-fade"
                style={{ backgroundImage: `url(${background})`, backgroundSize: 'cover', backgroundPosition: 'center', clipPath: 'polygon(0 0, 100% 0, 100% 80%, 0 100%)' }}
            >
                <div className="flex bg-gradient-to-b from-neutral-900 to-bg-black/20 backdrop-blur-lg justify-center items-center w-full h-full">
                    <div className="flex flex-col justify-center items-center">
                        <h1 className="text-4xl font-bold mb-4 text-center">Reset Password</h1>
                        <h1 className="text-3xl mb-4 text-center">It happens to the best of us..</h1>
                    </div>
                </div>
            </div>

            <div className="container pt-20 mb-4 text-neutral-900 dark:text-white bg-neutral-200 dark:bg-neutral-900 transition duration-200 justify-center justify-items-center animate-fade">
                <div className="w-full p-8 bg-neutral-300 dark:bg-neutral-800 text-neutral-900 dark:text-white transition duration-200 rounded-md shadow-md">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="flex flex-col">
                            <label className="mb-2">New Password:</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="p-2 rounded bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white"
                            />
                        </div>
                        <div className="flex flex-col">
                            <label className="mb-2">Confirm Password:</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                className="p-2 rounded bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white"
                            />
                        </div>
                        {message && <p style={{ color: 'green' }}>{message}</p>}
                        {error && <p style={{ color: 'red' }}>{error}</p>}
                        <button
                            type="submit"
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4"
                        >
                            Reset Password
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;