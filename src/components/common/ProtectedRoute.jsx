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

  if (role && user?.role !== role && !(role === 'staff' && user?.role === 'admin')) {
    return <Navigate to="/" replace />;
  }

  return children;
}
