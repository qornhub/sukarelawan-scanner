// app/scanner.tsx
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api, { loadTokenAndUser } from './api';

const { width: screenWidth } = Dimensions.get('window');
const SCANNER_SIZE = Math.min(screenWidth * 0.7, 300);

export default function ScannerScreen() {
  const router = useRouter();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const isProcessingRef = useRef(false);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  async function handleBarCodeScanned({ data }: { data: string }) {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    setScanned(true);
    setIsProcessing(true);

    try {
      await loadTokenAndUser();

      // Try parse JSON first
      let parsed: any = null;
      try { parsed = JSON.parse(data); } catch {}

      if (parsed?.payload && parsed?.signature) {
        const res = await api.post('/ngo/events/scan', {
          payload: parsed.payload,
          signature: parsed.signature,
        });
        Alert.alert('Success', res.data.message || 'Attendance recorded');
        return;
      }

      // Extract event id
      const urlRegex = /\/api\/ngo\/events\/([0-9a-fA-F-]{10,36})\/scan/;
      const match = data.match(urlRegex);
      let eventId = match?.[1] || null;
      if (!eventId && /^[0-9a-fA-F-]{8,36}$/.test(data.trim())) {
        eventId = data.trim();
      }

      if (!eventId) {
        Alert.alert('Unrecognized QR', 'This QR does not contain a valid event id or payload.');
        return;
      }

      const res = await api.post(`/ngo/events/${encodeURIComponent(eventId)}/scan`);
      if (res.status === 200 || res.status === 201) {
        Alert.alert('Success', res.data.message || 'Attendance recorded');
      } else {
        Alert.alert('Info', res.data.message || 'Response received');
      }
    } catch (err: any) {
      if (err.response?.data?.message) {
        Alert.alert('Failed', String(err.response.data.message));
      } else {
        Alert.alert('Error', 'Unable to record attendance. Check your network or server.');
      }
    } finally {
      setTimeout(() => {
        setScanned(false);
        setIsProcessing(false);
        isProcessingRef.current = false;
      }, 1500);
    }
  }

  if (hasPermission === null) {
    return (
      <SafeAreaView style={[styles.center, styles.container]}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.permissionText}>Requesting camera permission...</Text>
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: '#fff' }]}>
        <StatusBar barStyle="dark-content" />
        <View style={[styles.header, { backgroundColor: '#fff' }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: '#000' }]}>Scanner</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={[styles.center, { backgroundColor: '#fff' }]}>
          <Ionicons name="videocam-off" size={64} color="#999" />
          <Text style={[styles.permissionText, { color: '#000' }]}>No access to camera</Text>
          <Text style={styles.subText}>Please grant permission in settings</Text>
          <TouchableOpacity style={styles.button} onPress={() => router.back()}>
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scanner</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.scannerContainer}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          barcodeScannerSettings={{
            barcodeTypes: ["qr", "pdf417", "code128"],
          }}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        />

        {/* Frame Overlay */}
        <View style={styles.overlay}>
          <View style={styles.scannerFrame}>
            <View style={[styles.corner, styles.cornerTopLeft]} />
            <View style={[styles.corner, styles.cornerTopRight]} />
            <View style={[styles.corner, styles.cornerBottomLeft]} />
            <View style={[styles.corner, styles.cornerBottomRight]} />
          </View>

          {isProcessing && (
            <View style={styles.processingOverlay}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.processingText}>Processing...</Text>
            </View>
          )}

          <Text style={styles.instructionText}>
            Position the QR code within the frame
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 12 : 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#000',
  },
  backButton: { padding: 8 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '600' },
  placeholder: { width: 40 },
  scannerContainer: {
    flex: 1,
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  permissionText: { fontSize: 16, fontWeight: '600', marginTop: 16, textAlign: 'center' },
  subText: { fontSize: 14, color: '#666', marginTop: 8, textAlign: 'center', marginBottom: 24 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  scannerFrame: {
    width: SCANNER_SIZE,
    height: SCANNER_SIZE,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'transparent',
    position: 'relative',
  },
  corner: { position: 'absolute', width: 30, height: 30, borderColor: '#0066cc' },
  cornerTopLeft: { top: -2, left: -2, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 12 },
  cornerTopRight: { top: -2, right: -2, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 12 },
  cornerBottomLeft: { bottom: -2, left: -2, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 12 },
  cornerBottomRight: { bottom: -2, right: -2, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 12 },
  instructionText: { color: '#fff', fontSize: 14, marginTop: 32, textAlign: 'center', paddingHorizontal: 32 },
  processingOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  processingText: { color: '#fff', marginTop: 12, fontSize: 16 },
  button: {
    backgroundColor: '#0066cc',
    padding: 12,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '600' },
});
