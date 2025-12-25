'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminFetch, getAdminApiUrl, getAdminAuthMode, setAdminIdToken } from '@/lib/admin/api';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[Login] handleSubmit called', { username });
    setError('');
    setLoading(true);
    try {
      const mode = getAdminAuthMode();
      console.log('[Login] Auth mode:', mode);

      // Dev server mode: Firebase Auth (token)
      if (mode === 'token') {
        console.log('[Login] Attempting Firebase Auth login...');
        const credential = await signInWithEmailAndPassword(auth, username, password);
        const token = await credential.user.getIdToken();
        setAdminIdToken(token);
        console.log('[Login] Firebase Auth success, token obtained');

        // Verify admin mapping exists (admins.authUid == uid)
        const me = await adminFetch('auth/me', { method: 'GET' });
        console.log('[Login] auth/me response:', me.status, me.statusText);
        if (!me.ok) {
          const data = await me.json().catch(() => ({}));
          setError(data.error || '관리자 권한이 없습니다.');
          return;
        }

        router.push('/admin');
        router.refresh();
        return;
      }

      // Customer/prod mode: cookie-based login
      console.log('[Login] Attempting cookie-based login...');
      const actualUrl = getAdminApiUrl('login');
      console.log('[Login] Request URL:', actualUrl);
      const response = await adminFetch('login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      console.log('[Login] Response status:', response.status, response.statusText);

      if (response.ok) {
        const data = await response.json().catch(() => ({}));
        console.log('[Login] Response data:', data);

        // NOTE:
        // - admin-auth cookie is HttpOnly, so it is NOT visible via `document.cookie`.
        // - Also, browsers do not expose `Set-Cookie` via fetch response headers.
        // Verify session by calling auth/me instead.
        const me = await adminFetch('auth/me', { method: 'GET' });
        if (!me.ok) {
          const err = await me.json().catch(() => ({}));
          setError(err.error || '로그인 세션 확인에 실패했습니다.');
          return;
        }

        console.log('[Login] Login successful, redirecting...');
        router.push('/admin');
        router.refresh();
      } else {
        const data = await response.json().catch(() => ({}));
        console.error('[Login] Login failed:', data);
        setError(data.error || `로그인에 실패했습니다. (${response.status})`);
      }
    } catch (err) {
      console.error('[Login] Error:', err);
      setError(err instanceof Error ? err.message : '로그인 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main>
      <div className="container">
        <section className="section register min-vh-100 d-flex flex-column align-items-center justify-content-center py-4">
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-lg-4 col-md-6 d-flex flex-column align-items-center justify-content-center">
                <div className="d-flex justify-content-center py-4">
                  <a href="/admin" className="logo d-flex align-items-center w-auto">
                    <img src="/assets/img/logo_atsignal.png" alt="" />
                    <span className="d-none d-lg-block">atsignal Admin</span>
                  </a>
                </div>

                <div className="card mb-3">
                  <div className="card-body">
                    <div className="pt-4 pb-2">
                      <h5 className="card-title text-center pb-0 fs-4">Login to Your Account</h5>
                      <p className="text-center small">Enter your username &amp; password to login</p>
                    </div>

                    <form className="row g-3 needs-validation" onSubmit={handleSubmit} noValidate>
                      <div className="col-12">
                        <label htmlFor="yourUsername" className="form-label">
                          Username
                        </label>
                        <div className="input-group has-validation">
                          <span className="input-group-text" id="inputGroupPrepend">
                            @
                          </span>
                          <input
                            type="text"
                            name="username"
                            className="form-control"
                            id="yourUsername"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                          />
                          <div className="invalid-feedback">Please enter your username.</div>
                        </div>
                      </div>

                      <div className="col-12">
                        <label htmlFor="yourPassword" className="form-label">
                          Password
                        </label>
                        <input
                          type="password"
                          name="password"
                          className="form-control"
                          id="yourPassword"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                        <div className="invalid-feedback">Please enter your password!</div>
                      </div>

                      {error ? (
                        <div className="col-12">
                          <div className="alert alert-danger" role="alert">
                            {error}
                          </div>
                        </div>
                      ) : null}

                      <div className="col-12">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            name="remember"
                            value="true"
                            id="rememberMe"
                          />
                          <label className="form-check-label" htmlFor="rememberMe">
                            Remember me
                          </label>
                        </div>
                      </div>

                      <div className="col-12">
                        <button className="btn btn-primary w-100" type="submit" disabled={loading}>
                          {loading ? 'Logging in...' : 'Login'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}


