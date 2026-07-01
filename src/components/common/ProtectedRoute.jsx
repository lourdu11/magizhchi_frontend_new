import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store';
import { useState, useEffect } from 'react';
import PageLoader from './PageLoader';

export default function ProtectedRoute({ children, role }) {
  const { isAuthenticated, user } = useAuthStore();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Check if store has finished rehydrating from storage
    const checkHydration = () => {
      if (useAuthStore.persist.hasHydrated()) {
        setIsHydrated(true);
      }
    };

    checkHydration();
    // Optional: Add a small buffer for complex rehydration
    const timer = setTimeout(checkHydration, 50); 
    return () => clearTimeout(timer);
  }, []);

  if (!isHydrated) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Allow admin full access. If role is admin, allow staff too (since they share AdminLayout, we filter internally).
  if (role && user?.role !== role) {
    const isAdminRoute = role === 'admin';
    const isStaffTryingToAccessAdminRoute = isAdminRoute && user?.role === 'staff';
    const isStaffRoute = role === 'staff';
    const isAdminTryingToAccessStaffRoute = isStaffRoute && user?.role === 'admin';

    if (!isStaffTryingToAccessAdminRoute && !isAdminTryingToAccessStaffRoute) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
}
