'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Input';

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // The middleware redirects non-admins here with ?error=forbidden. That means
  // a session already exists for an account without the admin role, so it is
  // cleared — otherwise the stale cookie keeps bouncing the user back here.
  // The param is stripped so the message does not survive a reload.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('error') !== 'forbidden') return;
    setError('Ce compte n’a pas accès à l’administration. Vous avez été déconnecté.');
    createClient()
      .auth.signOut()
      .catch(() => {
        // Already invalid server-side; nothing useful to show.
      });
    window.history.replaceState(null, '', window.location.pathname);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data, error: authError } = await createClient().auth.signInWithPassword({ email, password });
      if (authError) {
        setError(
          authError.message === 'Invalid login credentials'
            ? 'E-mail ou mot de passe incorrect.'
            : 'Connexion impossible. Réessayez dans un instant.'
        );
        console.error('[admin/login]', authError);
        return;
      }
      if (data.user) {
        router.push('/admin');
        router.refresh();
      }
    } catch (err) {
      console.error('[admin/login]', err);
      setError('Connexion impossible. Vérifiez votre connexion internet.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen grid place-items-center px-4 py-12">
      <div className="w-full max-w-sm">
        <h1 className="t-h2 text-center">Administration</h1>
        <p className="t-small text-center mt-2">Connectez-vous pour gérer la boutique.</p>

        <form onSubmit={handleLogin} className="mt-8 space-y-5 rounded-lg border border-line bg-white p-6">
          {error && (
            <p role="alert" className="flex items-start gap-2.5 rounded-md bg-error-subtle p-3 text-small text-ink">
              <AlertCircle size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-error" />
              {error}
            </p>
          )}
          <Field label="E-mail">
            <Input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </Field>
          <Field label="Mot de passe">
            <Input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </Field>
          <Button type="submit" fullWidth size="lg" disabled={loading}>
            {loading ? 'Connexion…' : 'Se connecter'}
          </Button>
        </form>
      </div>
    </main>
  );
}
