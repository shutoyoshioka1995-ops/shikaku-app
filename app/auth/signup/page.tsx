import { redirect } from 'next/navigation';

export default function AuthSignupRedirectPage() {
  redirect('/login?mode=signup');
}
