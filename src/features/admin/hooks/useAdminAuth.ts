import { useState } from 'react';

const ADMIN_KEY = 'gs-admin-authenticated';

export function useAdminAuth() {
  const [isAdmin, setIsAdmin] = useState<boolean>(
    () => sessionStorage.getItem(ADMIN_KEY) === 'true'
  );

  const authenticate = (password: string): boolean => {
    const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD as string;
    if (password === adminPassword) {
      sessionStorage.setItem(ADMIN_KEY, 'true');
      setIsAdmin(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    sessionStorage.removeItem(ADMIN_KEY);
    setIsAdmin(false);
  };

  return { isAdmin, authenticate, logout };
}
