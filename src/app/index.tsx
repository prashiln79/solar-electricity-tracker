import { Redirect } from 'expo-router';

export default function Index() {
  // In Phase 2, this will check auth state and redirect to (auth) if needed.
  return <Redirect href="/(tabs)" />;
}
