import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <main className="shell auth-shell">
      <SignUp
        path="/sign-up"
        signInUrl="/sign-in"
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
