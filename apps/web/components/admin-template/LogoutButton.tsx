'use client';

import { useRouter } from 'next/navigation';
import { adminFetch, clearAdminIdToken, getAdminAuthMode } from '@/lib/admin/api';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const mode = getAdminAuthMode();
      if (mode === 'token') {
        clearAdminIdToken();
        await signOut(auth).catch(() => {});
        router.push('/admin/login');
        router.refresh();
        return;
      }

      const response = await adminFetch('logout', { method: 'POST' });

      if (response.ok) {
        router.push('/admin/login');
        router.refresh();
      } else {
        console.error('Logout failed:', await response.text());
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <a
      className="dropdown-item d-flex align-items-center"
      href="#"
      onClick={(e) => {
        e.preventDefault();
        void handleLogout();
      }}
    >
      <i className="bi bi-box-arrow-right"></i>
      <span>Sign Out</span>
    </a>
  );
}


