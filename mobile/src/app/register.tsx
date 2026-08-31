import { Redirect } from 'expo-router';
// Registration is now handled through the OTP flow starting at /login
export default function Register() {
  return <Redirect href="/login" />;
}
