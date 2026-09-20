import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchClient } from '../api/client';

const RoleContext = createContext();

export const RoleProvider = ({ children }) => {
    const [role, setRole] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);

    useEffect(() => {
        const restoreSession = async () => {
            const token = localStorage.getItem('acts_token');
            if (!token) {
                // Wipe any residual legacy roles silently
                localStorage.removeItem('acts_role');
                setAuthLoading(false);
                return;
            }

            try {
                const userRes = await fetchClient('/me/');
                setRole(userRes.is_admin ? 'admin' : 'citizen');
                // Ensure acts_role artifact is explicitly demolished
                localStorage.removeItem('acts_role');
            } catch (err) {
                setRole(null);
                localStorage.removeItem('acts_token');
                localStorage.removeItem('acts_role');
            } finally {
                setAuthLoading(false);
            }
        };

        restoreSession();
    }, []);

    const login = (selectedRole) => {
        setRole(selectedRole);
    };

    const logout = () => {
        setRole(null);
        localStorage.removeItem('acts_token');
        localStorage.removeItem('acts_role');
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
