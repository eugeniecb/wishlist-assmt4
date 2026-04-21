import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <main className="shell auth-shell">
      <SignIn
        path="/sign-in"
        signUpUrl="/sign-up"
        fallbackRedirectUrl="/dashboard"
        appearance={{
          variables: {
            colorPrimary: '#0f766e',
            borderRadius: '1rem'
          }
        }}
      />
    </main>
  );
}
