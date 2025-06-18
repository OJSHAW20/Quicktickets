import AuthPage from '../AuthClient';

export const metadata = { title: 'Sign in / Register' }; // optional

export default function SignInPage() {
  return <AuthPage mode="signin" />;
}
