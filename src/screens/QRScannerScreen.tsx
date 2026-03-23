import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useAuth } from '../context/AuthContext';
import { ComplaintLocation } from '../context/ComplaintContext';

const validLocations: ComplaintLocation[] = [
  'cafeteria',
  'dormitory',
  'registrar',
  'hr-office',
  'faculty',
  'library',
  'unknown',
];

export function QRScannerScreen({ navigation }: any) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const { user } = useAuth();

  const continueWithLocation = (location: ComplaintLocation) => {
    if (user) {
      navigation.replace('ComplaintForm', { location, source: 'qr-scan' });
      return;
    }

    navigation.replace('RoleChoice', { location, source: 'qr-scan' });
  };

  const resolveLocation = (rawValue: string): ComplaintLocation | null => {
    try {
      const parsed = JSON.parse(rawValue);
      if (parsed.location && validLocations.includes(parsed.location)) {
        return parsed.location;
      }
    } catch {
      const normalized = rawValue.trim().toLowerCase() as ComplaintLocation;
      if (validLocations.includes(normalized)) {
        return normalized;
      }
    }

    return null;
  };

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionTitle}>Camera access is needed to scan campus QR codes.</Text>
        <Text style={styles.permissionText}>
          Once granted, the app can open the complaint flow for the exact campus office or building.
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Allow Camera Access</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={
          scanned
            ? undefined
            : ({ data }: { data: string }) => {
                setScanned(true);
                const location = resolveLocation(data);

                if (!location) {
                  Alert.alert('Invalid QR Code', 'This QR code does not contain a supported campus location.');
                  setScanned(false);
                  return;
                }

                continueWithLocation(location);
              }
        }
      />

      <View style={styles.overlay}>
        <View style={styles.scanCard}>
          <Text style={styles.scanTitle}>Point the camera at a campus QR code</Text>
          <Text style={styles.scanText}>
            After scanning, the app will ask whether the complaint is being submitted as a student, visitor, or anonymously.
          </Text>

          {scanned ? (
            <TouchableOpacity style={styles.scanButton} onPress={() => setScanned(false)}>
              <Text style={styles.scanButtonText}>Scan Again</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.18)',
  },
  scanCard: {
    backgroundColor: 'rgba(8, 30, 52, 0.9)',
    borderRadius: 22,
    padding: 20,
  },
  scanTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },
  scanText: {
    color: '#D7E8FF',
    lineHeight: 21,
  },
  scanButton: {
    backgroundColor: '#0F6CBD',
    borderRadius: 14,
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 18,
  },
  scanButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#F4F7FB',
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#15324B',
    marginBottom: 12,
  },
  permissionText: {
    color: '#486581',
    lineHeight: 22,
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: '#0F6CBD',
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center',
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
