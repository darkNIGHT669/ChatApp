import { redirect } from "next/navigation";

/**
 * app/page.tsx
 *
 * The root "/" route. We redirect immediately to "/chat".
 * This is a Server Component — redirect() works perfectly here.
 * Clerk middleware will intercept and redirect to sign-in if unauthenticated.
 */
export default function Home() {
  redirect("/chat");
}
