import Link from 'next/link';
import { SignedIn, SignedOut } from '@clerk/nextjs';

export default function HomePage() {
  return (
    <main className="shell shell--landing">
      <section className="landing-hero">
        <div className="landing-hero__frame">
          <div className="landing-hero__content">
            <div className="landing-hero__copy">
              <p className="eyebrow">Personal event intelligence</p>
              <h1>Stay close to the natural events worth watching.</h1>
              <p className="lede">
                Planet Watch keeps your view focused, current, and easy to scan, so major
                developments never disappear into noise.
              </p>
              <div className="landing-actions">
                <SignedOut>
                  <Link href="/sign-up" className="button button--primary">
                    Create your watchlist
                  </Link>
                  <Link href="/sign-in" className="button button--secondary">
                    Sign in
                  </Link>
                </SignedOut>
                <SignedIn>
                  <Link href="/dashboard" className="button button--primary" prefetch={false}>
                    Open dashboard
                  </Link>
                </SignedIn>
                <p className="support-copy">
                  Choose the places and event categories you care about, then return to one calm
                  dashboard whenever conditions change.
                </p>
              </div>
            </div>

            <div className="hero-highlights">
              <div className="hero-highlights__item">
                <strong>Focused</strong>
                <span>A watchlist shaped around your own regions and priorities.</span>
              </div>
              <div className="hero-highlights__item">
                <strong>Current</strong>
                <span>Fresh activity appears without forcing you to hunt for updates.</span>
              </div>
              <div className="hero-highlights__item">
                <strong>Clear</strong>
                <span>Every event is summarized in a format built for fast review.</span>
              </div>
            </div>
          </div>

          <div className="landing-hero__visual" aria-hidden="true">
            <div className="orbit-lines" />
            <div className="orbital-ring orbital-ring--one" />
            <div className="orbital-ring orbital-ring--two" />
            <div className="glow-point glow-point--one" />
            <div className="glow-point glow-point--two" />
            <div className="visual-panel visual-panel--summary">
              <strong>Curated for your line of sight</strong>
              <span>Monitor significant activity with a quieter, more disciplined reading view.</span>
            </div>
            <div className="visual-panel visual-panel--footer">
              <strong>Built for repeat visits</strong>
              <span>The experience stays lightweight, readable, and ready when new activity appears.</span>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-section__grid">
          <article className="landing-panel landing-panel--tall">
            <div className="section-copy">
              <p className="eyebrow">How it feels</p>
              <h2>A more professional way to monitor global activity.</h2>
              <p className="lede">
                The interface is designed to read like a briefing, not a feed dump. You see what
                changed, why it matters, and where to go next.
              </p>
            </div>
          </article>

          <article className="landing-panel">
            <ul className="signal-list">
              <li>
                <h3>Personal filters</h3>
                <p className="support-copy">
                  Keep the stream centered on the categories, distance, and status rules that match
                  your priorities.
                </p>
              </li>
              <li>
                <h3>Fast event review</h3>
                <p className="support-copy">
                  Titles, timing, magnitude, and location details stay grouped together for quick
                  decisions.
                </p>
              </li>
              <li>
                <h3>Always in motion</h3>
                <p className="support-copy">
                  The dashboard stays current so you can revisit it like a live watch desk.
                </p>
              </li>
            </ul>
          </article>
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-panel">
          <div className="landing-section__grid">
            <div className="section-copy">
              <p className="eyebrow">Reading rhythm</p>
              <h2>From first glance to full context in a few seconds.</h2>
              <p className="lede">
                Planet Watch is structured around a simple operating pattern: orient quickly, scan
                what changed, and open the events that deserve a closer look.
              </p>
            </div>

            <ol className="timeline-list">
              <li>
                <strong>01</strong>
                <h3>Set your viewing range</h3>
                <p>Save the places and categories that define your watch area.</p>
              </li>
              <li>
                <strong>02</strong>
                <h3>Watch the feed sharpen</h3>
                <p>Only matching activity remains in view, with its key details surfaced.</p>
              </li>
              <li>
                <strong>03</strong>
                <h3>Return whenever needed</h3>
                <p>The dashboard is built to feel current the moment you reopen it.</p>
              </li>
            </ol>
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-panel final-cta">
          <div className="section-copy">
            <p className="eyebrow">Ready to begin</p>
            <h2>Keep a better watch on what is unfolding.</h2>
            <p className="lede">
              Create your account to build a quieter, more useful event view around your own
              priorities.
            </p>
          </div>
          <SignedOut>
            <Link href="/sign-up" className="button button--primary">
              Get started
            </Link>
          </SignedOut>
          <SignedIn>
            <Link href="/dashboard" className="button button--primary" prefetch={false}>
              Go to dashboard
            </Link>
          </SignedIn>
        </div>
      </section>
    </main>
  );
}
