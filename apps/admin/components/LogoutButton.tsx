'use client';

import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', {
        method: 'POST',
      });
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <a className="dropdown-item d-flex align-items-center" href="#" onClick={(e) => { e.preventDefault(); handleLogout(); }}>
      <i className="bi bi-box-arrow-right"></i>
      <span>Sign Out</span>
    </a>
  );
}

