import type { Metadata } from 'next';
import { ClerkProvider, SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import './globals.css';

export const metadata: Metadata = {
  title: 'Planet Watch',
  description: 'A refined natural event watchlist with live updates tailored to each user.'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <ClerkProvider
          appearance={{
            variables: {
              colorPrimary: '#171513',
              colorBackground: '#fffaf7',
              borderRadius: '1rem'
            }
          }}
        >
          <header className="site-header">
            <div className="site-header__inner">
              <a href="/" className="site-brand">
                <span className="site-brand__mark" aria-hidden="true">
                  PW
                </span>
                <span className="site-brand__text">
                  <span className="site-brand__name">Planet Watch</span>
                  <span className="site-brand__tag">A clearer view of global activity</span>
                </span>
              </a>
              <nav className="site-nav">
                <SignedOut>
                  <SignInButton mode="modal">
                    <button type="button" className="button button--ghost">
                      Sign in
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button type="button" className="button button--primary">
                      Sign up
                    </button>
                  </SignUpButton>
                </SignedOut>
                <SignedIn>
                  <UserButton afterSignOutUrl="/" />
                </SignedIn>
              </nav>
            </div>
          </header>
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
