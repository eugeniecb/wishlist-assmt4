import { redirect } from 'next/navigation';
import { login, signup } from '@/app/actions';
import { createClient } from '@/lib/supabase/server';

type HomePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getSingleValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const supabase = await createClient();
  const params = await searchParams;
  const message = getSingleValue(params.message);
  const error = getSingleValue(params.error);
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user) {
    redirect('/dashboard');
  }

  return (
    <main className="shell shell--auth">
      <section className="hero-panel">
        <p className="eyebrow">Assignment 4 frontend</p>
        <h1>Track the planetary events that actually matter to you.</h1>
        <p className="lede">
          Signal Atlas pulls NASA EONET events from Supabase, filters them by each user&apos;s
          preferences, and refreshes the feed live through Realtime.
        </p>
        <div className="pill-row">
          <span className="pill">Supabase Auth</span>
          <span className="pill">Realtime feed</span>
          <span className="pill">Per-user filters</span>
        </div>
      </section>

      <section className="auth-grid">
        <div className="card">
          <div className="card-header">
            <p className="eyebrow">Sign in</p>
            <h2>Return to your watchlist</h2>
          </div>
          <form action={login} className="stack">
            <label className="field">
              <span>Email</span>
              <input name="email" type="email" placeholder="you@example.com" required />
            </label>
            <label className="field">
              <span>Password</span>
              <input name="password" type="password" placeholder="••••••••" required />
            </label>
            <button type="submit" className="button button--primary">
              Sign in
            </button>
          </form>
        </div>

        <div className="card">
          <div className="card-header">
            <p className="eyebrow">Create account</p>
            <h2>Save your own signal profile</h2>
          </div>
          <form action={signup} className="stack">
            <label className="field">
              <span>Display name</span>
              <input name="display_name" type="text" placeholder="Storm watcher" />
            </label>
            <label className="field">
              <span>Email</span>
              <input name="email" type="email" placeholder="you@example.com" required />
            </label>
            <label className="field">
              <span>Password</span>
              <input name="password" type="password" placeholder="Create a password" required />
            </label>
            <button type="submit" className="button button--secondary">
              Create account
            </button>
          </form>
        </div>

        {(message || error) && (
          <aside className={`flash ${error ? 'flash--error' : 'flash--ok'}`}>
            {error ?? message}
          </aside>
        )}
      </section>
    </main>
  );
}
