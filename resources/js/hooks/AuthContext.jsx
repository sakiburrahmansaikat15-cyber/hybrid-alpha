import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isInitialized, setIsInitialized] = useState(false);

    // Helper to set token
    const setToken = (token) => {
        if (token) {
            localStorage.setItem('auth_token', token);
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
            localStorage.removeItem('auth_token');
            delete axios.defaults.headers.common['Authorization'];
        }
    };

    const fetchUser = async () => {
        const token = localStorage.getItem('auth_token');
        if (!token) {
            setLoading(false);
            setIsInitialized(true);
            return;
        }

        // Set token for the initial request
        setToken(token);

        try {
            const response = await axios.get('/api/me');
            setUser(response.data.user);
        } catch (error) {
            console.error("Failed to fetch user", error);
            // If token is invalid, clear it
            setToken(null);
            setUser(null);
        } finally {
            setLoading(false);
            setIsInitialized(true);
        }
    };

    useEffect(() => {
        fetchUser();
    }, []);

    const login = async (email, password) => {
        // We don't need CSRF cookie for Token auth, but keeping it doesn't hurt
        // await axios.get('/sanctum/csrf-cookie'); 

        const response = await axios.post('/api/login', { email, password });
        const { user, token } = response.data;

        setToken(token);
        setUser(user);

        return response.data;
    };

    const logout = async () => {
        try {
            await axios.post('/api/logout');
        } catch (e) {
            // Ignore logout errors (e.g. if token already invalid)
        }
        setToken(null);
        setUser(null);
        window.location.href = '/login';
    };

    return (
        <AuthContext.Provider value={{ user, loading, isInitialized, login, logout, setUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
