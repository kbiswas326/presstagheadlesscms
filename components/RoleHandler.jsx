'use client';

import { useEffect } from 'react';

const RoleHandler = () => {
  useEffect(() => {
    const handleRoleStorage = () => {
      // Get role from response headers
      const userRole = document.querySelector('meta[name="x-user-role"]')?.getAttribute('content');
      const userData = document.querySelector('meta[name="x-user-data"]')?.getAttribute('content');

      if (userRole) {
        localStorage.setItem('role', userRole);
      }

      if (userData) {
        const user = JSON.parse(userData);
        localStorage.setItem('id', JSON.stringify(user._id));
      }
    };

    handleRoleStorage();
  }, []);

  return null; // This component doesn't render anything
};

export default RoleHandler;
