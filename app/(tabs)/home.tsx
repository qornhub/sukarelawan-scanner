import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.welcome}>Hello Volunteer 👋</Text>
      
      {/* Logout button */}
      <TouchableOpacity 
        style={styles.button}
        onPress={() => router.replace('/login')}
      >
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>

      {/* Scan QR button */}
      <TouchableOpacity 
        style={styles.button}
        onPress={() => router.push('/scanner')}   // ✅ absolute path
      >
        <Text style={styles.buttonText}>Scan QR</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  welcome: { fontSize: 22, fontWeight: '700', marginBottom: 20 },
  button: { backgroundColor: '#cc0000', padding: 12, borderRadius: 8, marginTop: 12 },
  buttonText: { color: '#fff', fontWeight: '600' },
});
