import Link from 'next/link';
import { SignedIn, SignedOut } from '@clerk/nextjs';

export default function HomePage() {
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
        <SignedOut>
          <div className="card">
            <div className="card-header">
              <p className="eyebrow">Sign in</p>
              <h2>Return to your watchlist</h2>
            </div>
            <div className="stack">
              <p className="lede">Use Clerk to sign in and reopen your personalized event feed.</p>
              <Link href="/sign-in" className="button button--primary">
                Sign in
              </Link>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <p className="eyebrow">Create account</p>
              <h2>Save your own signal profile</h2>
            </div>
            <div className="stack">
              <p className="lede">Create a Clerk account and start saving category and radius filters.</p>
              <Link href="/sign-up" className="button button--secondary">
                Create account
              </Link>
            </div>
          </div>
        </SignedOut>

        <SignedIn>
          <div className="card card--wide">
            <div className="card-header">
              <p className="eyebrow">Signed in</p>
              <h2>Your dashboard is ready.</h2>
            </div>
            <div className="stack">
              <p className="lede">
                Clerk is active. Open the dashboard to manage your preferences and watch live event updates.
              </p>
              <Link href="/dashboard" className="button button--primary" prefetch={false}>
                Open dashboard
              </Link>
            </div>
          </div>
        </SignedIn>
      </section>
    </main>
  );
}
