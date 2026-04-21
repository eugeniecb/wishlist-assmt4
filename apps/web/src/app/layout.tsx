import type { Metadata } from 'next';
import { ClerkProvider, SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import './globals.css';

export const metadata: Metadata = {
  title: 'Signal Atlas',
  description: 'Personalized natural event tracking built on Supabase and EONET.'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <ClerkProvider
          appearance={{
            variables: {
              colorPrimary: '#0f766e',
              colorBackground: '#fffaf0',
              borderRadius: '1rem'
            }
          }}
        >
          <header className="site-header">
            <a href="/" className="site-brand">
              Signal Atlas
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
          </header>
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
