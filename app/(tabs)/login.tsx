
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import api, { setTokenAndUser } from '../api';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert('Please enter email and password');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/login', { email, password });
      // expected: { token: "...", user: { id, name, role } }
      const { token, user } = res.data;

      // optional client-side role check (server will also enforce)
      if (!user || (user.role && user.role.toLowerCase() !== 'volunteer')) {
        setLoading(false);
        Alert.alert('Access denied', 'Only volunteers can log in.');
        return;
      }

      await setTokenAndUser(token, user);

      setLoading(false);

      // navigate to home (index) or scanner page
      router.replace('/home'); // or router.replace('/scanner') if you create scanner page
    } catch (err: any) {
      setLoading(false);
      if (err.response && err.response.data && err.response.data.message) {
        Alert.alert('Login failed', String(err.response.data.message));
      } else {
        Alert.alert('Login failed', 'Network or server error');
      }
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Volunteer Login</Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={styles.input}
      />

      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Log in</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 24, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 8, marginBottom: 12 },
  button: { backgroundColor: '#0066cc', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontWeight: '600' },
});
