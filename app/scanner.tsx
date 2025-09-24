// app/scanner.tsx
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Button } from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { useRouter } from 'expo-router';
import api, { loadTokenAndUser } from './api';

export default function ScannerScreen() {
  const router = useRouter();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
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
        isProcessingRef.current = false;
        return;
      }

      // Extract event id from scanned URL or just use it directly
      const urlRegex = /\/api\/ngo\/events\/([0-9a-fA-F-]{10,36})\/scan/;
      const match = data.match(urlRegex);

      let eventId = match?.[1] || null;
      if (!eventId && /^[0-9a-fA-F-]{8,36}$/.test(data.trim())) {
        eventId = data.trim();
      }

      if (!eventId) {
        Alert.alert('Unrecognized QR', 'This QR does not contain a valid event id or payload.');
        isProcessingRef.current = false;
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
        isProcessingRef.current = false;
      }, 1500);
    }
  }

  if (hasPermission === null) {
    return (
      <View style={styles.center}>
        <Text>Requesting camera permission...</Text>
      </View>
    );
  }
  if (hasPermission === false) {
    return (
      <View style={styles.center}>
        <Text>No access to camera — please grant permission in settings.</Text>
        <Button title="Back" onPress={() => router.back()} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Scan Attendance QR</Text>

      <View style={styles.scannerContainer}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          barcodeScannerSettings={{
            barcodeTypes: ["qr", "pdf417", "code128"], // allow QR & others
          }}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        />
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.button} onPress={() => router.replace('/home')}>
          <Text style={styles.buttonText}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: scanned ? '#999' : '#0066cc' }]}
          onPress={() => setScanned(false)}
          disabled={!scanned}
        >
          <Text style={styles.buttonText}>{scanned ? 'Ready again' : 'Scanning...'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 40 },
  header: { textAlign: 'center', fontSize: 18, fontWeight: '700', marginBottom: 8 },
  scannerContainer: { flex: 1, margin: 16, borderRadius: 12, overflow: 'hidden', backgroundColor: '#000' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  controls: { flexDirection: 'row', justifyContent: 'space-around', padding: 16 },
  button: { backgroundColor: '#0066cc', padding: 12, borderRadius: 8, minWidth: 120, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600' },
});
