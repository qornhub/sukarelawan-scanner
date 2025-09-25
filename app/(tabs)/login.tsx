// app/(tabs)/login.tsx
import React, { useState } from 'react';
import type { ReactElement } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome, FontAwesome5 } from '@expo/vector-icons';
import api, { setTokenAndUser } from '../api';

// local background image (already in your assets)
const BACKGROUND = require('../../assets/app login background.jpg');

export default function Login(): ReactElement {
  const router = useRouter();

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<string[]>([]);

  const validateEmailAddress = (value: string): boolean => {
    const re =
      /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(value).toLowerCase());
  };

  const handleLogin = async (): Promise<void> => {
    const nextErrors: string[] = [];
    if (!email) nextErrors.push('Email address is required');
    else if (!validateEmailAddress(email)) nextErrors.push('Please enter a valid email address');
    if (!password) nextErrors.push('Password is required');
    else if (password.length < 6) nextErrors.push('Password must be at least 6 characters');

    if (nextErrors.length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors([]);
    setLoading(true);

    try {
      const res = await (api as any).post('/login', { email, password });
      const { token, user } = (res && (res.data as any)) || {};

      if (!user || (user.role && String(user.role).toLowerCase() !== 'volunteer')) {
        setLoading(false);
        Alert.alert('Access denied', 'Only volunteers can log in.');
        return;
      }

      if (typeof setTokenAndUser === 'function') {
        await setTokenAndUser(token, user);
      }

      setLoading(false);
      router.replace('/home');
    } catch (err: unknown) {
      setLoading(false);
      const anyErr = err as any;
      const msg = anyErr?.response?.data?.message ?? anyErr?.message ?? 'Network or server error';
      Alert.alert('Login failed', String(msg));
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      {/* ImageBackground: put imageStyle opacity here so children are NOT affected */}
      <ImageBackground
  source={BACKGROUND}
  style={styles.imageBackgroundContainer}
  imageStyle={styles.imageBackgroundImage}
>
  {/* Blue overlay */}
  <View style={styles.overlay} />

  <ScrollView contentContainerStyle={styles.scrollContainer}>
    <View style={styles.outer}>
      <View style={styles.leftCard}>
              <CardContent
                logoSource={require('../../assets/sukarelawan_logo.png')}
                email={email}
                setEmail={setEmail}
                password={password}
                setPassword={setPassword}
                showPassword={showPassword}
                setShowPassword={setShowPassword}
                errors={errors}
                loading={loading}
                handleLogin={handleLogin}
              />
            </View>
          </View>
        </ScrollView>
      </ImageBackground>
    </KeyboardAvoidingView>
  );
}

function CardContent(props: {
  logoSource: any;
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  showPassword: boolean;
  setShowPassword: (s: boolean) => void;
  errors: string[];
  loading: boolean;
  handleLogin: () => Promise<void>;
}) {
  const { logoSource, email, setEmail, password, setPassword, showPassword, setShowPassword, errors, loading, handleLogin } = props;
  const iconGrey = '#6c757d';
  const signInIconColor = '#ffffff';

  return (
    <>
      <View style={styles.header}>
        <Image source={logoSource} style={styles.logo} resizeMode="contain" />
        <Text style={styles.appName}>SukaRelawan</Text>
      </View>

      <Text style={styles.welcome}>Hi Volunteers!</Text>

      <View style={styles.infoBox}>
        <FontAwesome name="info-circle" size={16} color={iconGrey} />
        <Text style={styles.infoText}>
          Please sign in using the same email and password you use on the Sukarelawan web system.
        </Text>
      </View>

      {errors.length > 0 && (
        <View style={styles.errorBox} accessibilityRole="alert">
          {errors.map((e, i) => (
            <Text key={i} style={styles.errorText}>• {e}</Text>
          ))}
        </View>
      )}

      {/* Email input */}
      <View style={styles.inputWrap}>
        <TextInput
          value={email}
          onChangeText={(v: string) => setEmail(v)}
          placeholder="Email Address"
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
          textContentType="username"
        />
        <FontAwesome name="envelope" size={18} color={iconGrey} style={styles.inputIcon} />
      </View>

      {/* Password input */}
      <View style={[styles.inputWrap, styles.passwordContainer]}>
        <TextInput
          value={password}
          onChangeText={(v: string) => setPassword(v)}
          placeholder="Password"
          secureTextEntry={!showPassword}
          style={styles.input}
          textContentType="password"
        />
        <FontAwesome name="lock" size={18} color={iconGrey} style={styles.inputIcon} />
        <Pressable style={styles.passwordToggle} onPress={() => setShowPassword(!showPassword)} accessibilityLabel="Toggle password visibility">
          <FontAwesome name={showPassword ? 'eye-slash' : 'eye'} size={20} color={iconGrey} />
        </Pressable>
      </View>

      {/* Login button */}
      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <View style={styles.buttonContent}>
            <FontAwesome5 name="sign-in-alt" size={16} color={signInIconColor} style={{ marginRight: 10 }} />
            <Text style={styles.buttonText}>Sign In</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Features */}
      <View style={styles.bottomFeatures}>
        <View style={styles.featureItem}>
          <FontAwesome5 name="check-circle" size={18} color={iconGrey} />
          <Text style={styles.featureText}>Connect with local organizations</Text>
        </View>
        <View style={styles.featureItem}>
          <FontAwesome5 name="check-circle" size={18} color={iconGrey} />
          <Text style={styles.featureText}>Make a positive impact</Text>
        </View>
        <View style={styles.featureItem}>
          <FontAwesome5 name="check-circle" size={18} color={iconGrey} />
          <Text style={styles.featureText}>Earn badges</Text>
        </View>
      </View>
    </>
  );
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const styles = StyleSheet.create({
  // scroll container centers content vertically
  scrollContainer: { flexGrow: 1 },

  outer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ImageBackground container (no opacity here)
  imageBackgroundContainer: {
    flex: 1,
    width: '100%',
  },

  // style applied directly to the image (only the image is dimmed)
  imageBackgroundImage: {
    resizeMode: 'cover',
    opacity: 100,
  },

  overlay: {
  ...StyleSheet.absoluteFillObject, // cover entire parent
  backgroundColor: 'rgba(123, 161, 212, 0.4)', // adjust opacity
},

  leftCard: {
    backgroundColor: '#ffffff', // <-- fully opaque so image does not show through
    borderRadius: 12,
    padding: 28,
    paddingVertical: 36,
    minHeight: 600,
    width: Math.min(700, SCREEN_WIDTH - 40),
    alignSelf: 'center',
    justifyContent: 'center',
    // elevation/shadow
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 14, shadowOffset: { width: 0, height: 6 } },
      android: { elevation: 10 },
    }),
  },

  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  logo: { width: 64, height: 64 },
  appName: { fontSize: 20, fontWeight: '700', color: '#004AAD', marginLeft: 8 },
  welcome: { fontSize: 22, fontWeight: '700', marginTop: 6, marginBottom: 6 },

  infoBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#eef6ff', padding: 10, borderRadius: 8, marginBottom: 12 },
  infoText: { marginLeft: 8, color: '#333', flex: 1 },

  errorBox: { backgroundColor: '#f8d7da', borderColor: '#f5c2c7', borderWidth: 1, padding: 10, borderRadius: 8, marginBottom: 12 },
  errorText: { color: '#842029', fontSize: 13, marginBottom: 4 },

  inputWrap: {
    marginBottom: 14,
    position: 'relative',
    justifyContent: 'center',
    minHeight: 50,
  },
  inputIcon: {
    position: 'absolute',
    left: 16,
    top: '50%',
    transform: [{ translateY: -9 }],
    zIndex: 20,
    elevation: 20,
  },
  input: {
    padding: 14,
    paddingLeft: 48,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    fontSize: 15,
    backgroundColor: '#ffffffff',
    zIndex: 10,
    elevation: 10,
  },
  passwordContainer: {},
  passwordToggle: { position: 'absolute', right: 12, zIndex: 20, elevation: 20 },

  button: { backgroundColor: '#004AAD', paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 12 },
  buttonContent: { flexDirection: 'row', alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700' },

  bottomFeatures: { marginTop: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  featureText: { marginLeft: 8, color: '#333' },
});
