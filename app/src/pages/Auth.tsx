import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Auth = () => {
  const { user, loading: authLoading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading) return;
    if (user) {
      navigate('/account');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const originalTitle = document.title;
    document.title = `${isLogin ? 'Sign In' : 'Create Account'} | AURA Apparel`;

    let metaDesc = document.querySelector('meta[name="description"]');
    const originalDesc = metaDesc ? metaDesc.getAttribute('content') : '';
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', `${isLogin ? 'Sign in' : 'Register an account'} with AURA to manage your orders, checkout safely, and access curated collections.`);

    return () => {
      document.title = originalTitle;
      if (metaDesc) {
        if (originalDesc) {
          metaDesc.setAttribute('content', originalDesc);
        } else {
          metaDesc.remove();
        }
      }
    };
  }, [isLogin]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/account`
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'An error occurred during Google authentication.');
      setLoading(false);
    }
  };

  const handleAuth = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate('/account');
      } else {
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters long.');
        }
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth`
          }
        });
        if (error) throw error;
        alert('Signup successful! You can now log in.');
        setIsLogin(true);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="section" style={{ paddingTop: '120px', minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="container" style={{ maxWidth: '400px' }}>
        <h1 className="text-center mb-8" style={{ fontSize: '2rem' }}>{isLogin ? 'Sign In' : 'Create Account'}</h1>
        
        {error && (
          <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '1rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input 
            type="email" 
            placeholder="Email Address" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required 
            style={{ padding: '1rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent' }} 
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required 
            style={{ padding: '1rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent' }} 
          />
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '1rem' }}>
            {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Register'}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0', color: 'var(--color-gray)', fontSize: '0.85rem' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--color-border)' }}></div>
          <span style={{ padding: '0 1rem' }}>or</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--color-border)' }}></div>
        </div>

        <button 
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="google-btn"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
          </svg>
          <span>Continue with Google</span>
        </button>

        <div className="text-center mt-4">
          <button 
            onClick={() => setIsLogin(!isLogin)} 
            style={{ fontSize: '0.875rem', textDecoration: 'underline', color: 'var(--color-gray)' }}
          >
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
