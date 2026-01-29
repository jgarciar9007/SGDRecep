import React, { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        try {
            const saved = localStorage.getItem('cndes_user');
            return saved ? JSON.parse(saved) : null;
        } catch (e) {
            return null;
        }
    });

    const login = useCallback(async (username, password) => {
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
                const userData = data.user;
                setUser(userData);
                localStorage.setItem('cndes_user', JSON.stringify(userData));
                return { success: true };
            } else {
                return { success: false, message: data.message || 'Error de autenticación' };
            }
        } catch (error) {
            console.error("Login error:", error);
            return { success: false, message: 'Error de conexión' };
        }
    }, []);

    const logout = useCallback(() => {
        setUser(null);
        localStorage.removeItem('cndes_user');
    }, []);

    return (
        <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
