import { SignIn } from "@clerk/nextjs";

/**
 * app/sign-in/[[...sign-in]]/page.tsx
 *
 * The [[...sign-in]] folder name is required by Clerk.
 * It catches all sub-routes that Clerk's sign-in flow needs
 * (e.g., /sign-in/factor-one, /sign-in/sso-callback, etc.)
 *
 * SignIn is a Clerk component that renders the full auth UI —
 * email/password, social login, etc. — all pre-built and secure.
 */
export default function SignInPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <SignIn />
    </main>
  );
}
