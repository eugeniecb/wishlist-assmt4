import Link from 'next/link';
import { SignedIn, SignedOut } from '@clerk/nextjs';

export default function HomePage() {
  return (
    <main className="landing-page">
      <section className="landing-page__hero">
        <div className="landing-page__copy">
          <h1>Stay close to the natural events worth watching.</h1>
          <p className="lede">
            Planet Watch keeps your view focused, current, and easy to scan, so major developments
            never disappear into noise.
          </p>
          <div className="landing-page__actions">
            <SignedOut>
              <Link href="/sign-up" className="button button--primary">
                Create your watchlist
              </Link>
              <Link href="/sign-in" className="button button--ghost">
                Sign in
              </Link>
            </SignedOut>
            <SignedIn>
              <Link href="/dashboard" className="button button--primary" prefetch={false}>
                Open dashboard
              </Link>
            </SignedIn>
          </div>
        </div>

        <div className="landing-page__visual" aria-hidden="true">
          <div className="map-orbit map-orbit--outer" />
          <div className="map-orbit map-orbit--inner" />
          <div className="map-grid" />
          <span className="map-node map-node--amber map-node--one" />
          <span className="map-node map-node--blue map-node--two" />
          <span className="map-node map-node--amber map-node--three" />
          <span className="map-node map-node--blue map-node--four" />
          <div className="map-glow map-glow--amber" />
          <div className="map-glow map-glow--blue" />
        </div>
      </section>

      <footer className="landing-page__footer">
        <p>© 2026 Planet Watch</p>
      </footer>
    </main>
  );
}
