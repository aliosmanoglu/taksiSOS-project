import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';
import { Sentry, initSentry } from '../lib/sentry';

initSentry();

function RootLayout() {
  return (
    <Sentry.ErrorBoundary
      fallback={
        <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', textAlign: 'center' }}>
            Bir şeyler ters gitti
          </Text>
          <Text style={{ color: '#999', fontSize: 14, marginTop: 10, textAlign: 'center' }}>
            Uygulama beklenmedik bir hatayla karşılaştı. Lütfen uygulamayı kapatıp tekrar açın.
          </Text>
        </View>
      }
    >
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
      </Stack>
      <StatusBar style="auto" />
    </Sentry.ErrorBoundary>
  );
}

export default Sentry.wrap(RootLayout);
