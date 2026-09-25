import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchClient } from '../api/client';

const RoleContext = createContext();

export const RoleProvider = ({ children }) => {
    const [role, setRole] = useState(() => localStorage.getItem('acts_role') || null);
    const [authLoading, setAuthLoading] = useState(true);

    useEffect(() => {
        const restoreSession = async () => {
            const token = localStorage.getItem('acts_token');
            const savedRole = localStorage.getItem('acts_role');

            if (!token) {
                setRole(null);
                setAuthLoading(false);
                return;
            }

            // If demo session, keep saved role without calling remote /me/
            if (token.startsWith('demo_')) {
                setRole(savedRole || 'admin');
                setAuthLoading(false);
                return;
            }

            try {
                const userRes = await fetchClient('/me/');
                const activeRole = userRes.is_admin ? 'admin' : 'citizen';
                setRole(activeRole);
                localStorage.setItem('acts_role', activeRole);
                if (userRes.username) localStorage.setItem('acts_username', userRes.username);
                if (userRes.full_name) localStorage.setItem('acts_name', userRes.full_name);
            } catch (err) {
                // Retain cached role and credentials so user is NEVER logged out on app restart or temporary network glitch
                console.warn('Background profile sync notice (session maintained):', err);
                if (savedRole) {
                    setRole(savedRole);
                }
            } finally {
                setAuthLoading(false);
            }
        };

        restoreSession();
    }, []);

    const login = (selectedRole) => {
        setRole(selectedRole);
        localStorage.setItem('acts_role', selectedRole);
    };

    const logout = () => {
        setRole(null);
        localStorage.removeItem('acts_token');
        localStorage.removeItem('acts_refresh');
        localStorage.removeItem('acts_role');
        localStorage.removeItem('acts_name');
        localStorage.removeItem('acts_email');
        localStorage.removeItem('acts_username');
    };

    if (authLoading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-gray-50 text-acts-citizen font-bold">
                Restoring securely...
            </div>
        );
    }

    return (
        <RoleContext.Provider value={{ role, login, logout }}>
            {children}
        </RoleContext.Provider>
    );
};

export const useRole = () => useContext(RoleContext);
