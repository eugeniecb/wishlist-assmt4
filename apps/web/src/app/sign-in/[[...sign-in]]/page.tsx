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
            colorPrimary: '#171513',
            borderRadius: '1rem'
          }
        }}
      />
    </main>
  );
}
