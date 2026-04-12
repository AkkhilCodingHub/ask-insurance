import { Redirect } from 'expo-router';

// Always land on the home tab. Login is optional from the Profile tab.
export default function Index() {
  return <Redirect href="/(tabs)" />;
}
