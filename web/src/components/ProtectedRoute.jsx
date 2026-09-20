import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useRole } from '../context/RoleContext';

const ProtectedRoute = ({ allowedRoles }) => {
    const { role } = useRole();

    if (!role) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(role)) {
        return <Navigate to={role === 'citizen' ? '/report' : '/admin'} replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
