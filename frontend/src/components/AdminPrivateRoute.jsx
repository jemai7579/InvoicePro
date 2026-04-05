import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AdminAuthContext } from '../context/AdminAuthContext';

const AdminPrivateRoute = () => {
    const { admin, loading } = useContext(AdminAuthContext);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-premium-600"></div>
            </div>
        );
    }

    return admin ? <Outlet /> : <Navigate to="/admin/login" />;
};

export default AdminPrivateRoute;
