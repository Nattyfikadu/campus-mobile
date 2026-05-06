import { Picker } from '@react-native-picker/picker';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LOCATIONS, ISSUE_TYPES, getLocationLabel } from '../constants/complaints';
import { useAuth } from '../context/AuthContext';
import {
  ComplaintLocation,
  IssueType,
  LocalAttachment,
  useComplaints,
} from '../context/ComplaintContext';

export function ComplaintFormScreen({ navigation, route }: any) {
  const { user } = useAuth();
  const { addComplaint, submitAnonymousComplaint, uploadComplaintAttachments } = useComplaints();
  const mode = route.params?.mode || 'authenticated';
  const scannedLocation = (route.params?.location || 'unknown') as ComplaintLocation;
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState<ComplaintLocation>(scannedLocation);
  const [category, setCategory] = useState<IssueType>('other');
  const [submitting, setSubmitting] = useState(false);
  const [attachments, setAttachments] = useState<LocalAttachment[]>([]);

  const appendAttachments = (nextFiles: LocalAttachment[]) => {
    setAttachments((current) => {
      const merged = [...current, ...nextFiles].slice(0, 5);
      if (current.length + nextFiles.length > 5) {
        Alert.alert('Attachment limit', 'Only 5 attachments can be added to a complaint.');
      }
      return merged;
    });
  };

  const pickPhotoOrVideo = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo library access to attach images or videos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: true,
      quality: 0.9,
      selectionLimit: Math.max(1, 5 - attachments.length),
    });

    if (result.canceled) {
      return;
    }

    appendAttachments(
      result.assets.map((asset, index) => ({
        uri: asset.uri,
        name: asset.fileName || `media-${Date.now()}-${index}`,
        type: asset.mimeType || (asset.type === 'video' ? 'video/mp4' : 'image/jpeg'),
        kind: asset.type === 'video' ? 'video' : 'image',
      }))
    );
  };

  const pickAudioOrFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      multiple: true,
      copyToCacheDirectory: true,
      type: ['audio/*', 'video/*', 'image/*'],
    });

    if (result.canceled) {
      return;
    }

    appendAttachments(
      result.assets.map((asset, index) => ({
        uri: asset.uri,
        name: asset.name || `file-${Date.now()}-${index}`,
        type: asset.mimeType || 'application/octet-stream',
        kind: asset.mimeType?.startsWith('audio')
          ? 'audio'
          : asset.mimeType?.startsWith('video')
            ? 'video'
            : asset.mimeType?.startsWith('image')
              ? 'image'
              : 'file',
      }))
    );
  };

  const removeAttachment = (uri: string) => {
    setAttachments((current) => current.filter((item) => item.uri !== uri));
  };

  const submitComplaint = async () => {
    if (!title || !description) {
      Alert.alert('Missing details', 'Title and description are required.');
      return;
    }

    setSubmitting(true);

    if (mode === 'anonymous') {
      const result = await submitAnonymousComplaint({
        title,
        description,
        location,
        category,
        files: attachments,
      });
      setSubmitting(false);

      if (!result.success) {
        Alert.alert('Submission failed', result.error || 'Unable to submit complaint.');
        return;
      }

      navigation.replace('ThankYou', { trackingCode: result.trackingCode, isAnonymous: true });
      return;
    }

    if (!user) {
      setSubmitting(false);
      navigation.replace('RoleChoice', { location, source: route.params?.source || 'manual-entry' });
      return;
    }

    const complaint = await addComplaint({
      type: user.role === 'visitor' ? 'visitor' : 'student',
      title,
      description,
      category,
      location,
      submittedBy: {
        id: user.id,
        name: user.fullName,
        email: user.email,
      },
    });

    if (!complaint) {
      setSubmitting(false);
      Alert.alert('Submission failed', 'Unable to submit complaint.');
      return;
    }

    const uploadResult = await uploadComplaintAttachments(complaint.id, attachments);
    setSubmitting(false);

    if (!uploadResult.success) {
      Alert.alert(
        'Complaint saved with upload issue',
        uploadResult.error || 'The complaint was created, but attachments failed to upload.'
      );
    }

    navigation.replace('ThankYou', { complaintId: complaint.id, isAnonymous: false });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerCard}>
        <Text style={styles.title}>
          {mode === 'anonymous' ? 'Anonymous Complaint' : 'Complaint Form'}
        </Text>
        <Text style={styles.subtitle}>
          {mode === 'anonymous'
            ? 'Your identity will not be saved. You will receive a tracking code after submission.'
            : `Submitting as ${user?.role || 'user'} for ${getLocationLabel(location)}.`}
        </Text>
      </View>

      <Text style={styles.label}>Complaint title</Text>
      <TextInput
        style={styles.input}
        placeholder="Short summary of the issue"
        placeholderTextColor="#9CA3AF"
        value={title}
        onChangeText={setTitle}
      />

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Explain what happened and what the campus should fix"
        placeholderTextColor="#9CA3AF"
        multiline
        numberOfLines={6}
        value={description}
        onChangeText={setDescription}
      />

      <Text style={styles.label}>Location</Text>
      <View style={styles.pickerCard}>
        <Picker selectedValue={location} onValueChange={(value) => setLocation(value as ComplaintLocation)}>
          {LOCATIONS.map((item) => (
            <Picker.Item key={item.value} label={item.label} value={item.value} />
          ))}
        </Picker>
      </View>

      <Text style={styles.label}>Category</Text>
      <View style={styles.pickerCard}>
        <Picker selectedValue={category} onValueChange={(value) => setCategory(value as IssueType)}>
          {ISSUE_TYPES.map((item) => (
            <Picker.Item key={item.value} label={item.label} value={item.value} />
          ))}
        </Picker>
      </View>

      <Text style={styles.label}>Attachments</Text>
      <View style={styles.attachmentsCard}>
        <Text style={styles.attachmentHint}>
          Add up to 5 files. Photos, videos, and voice/audio files are supported on mobile.
        </Text>

        <TouchableOpacity style={styles.secondaryButton} onPress={pickPhotoOrVideo} disabled={submitting}>
          <Text style={styles.secondaryButtonText}>Add Photo or Video</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={pickAudioOrFile} disabled={submitting}>
          <Text style={styles.secondaryButtonText}>Add Voice or File</Text>
        </TouchableOpacity>

        {attachments.map((attachment) => (
          <View key={attachment.uri} style={styles.attachmentItem}>
            <View style={styles.attachmentMeta}>
              <Text style={styles.attachmentName} numberOfLines={1}>
                {attachment.name}
              </Text>
              <Text style={styles.attachmentType}>{attachment.kind.toUpperCase()}</Text>
            </View>
            <TouchableOpacity onPress={() => removeAttachment(attachment.uri)}>
              <Text style={styles.removeText}>Remove</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={submitComplaint} disabled={submitting}>
        {submitting ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.primaryButtonText}>Submit Complaint</Text>
        )}
      </TouchableOpacity>

      {mode !== 'anonymous' ? (
        <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('Dashboard')}>
          <Text style={styles.secondaryButtonText}>Back to Dashboard</Text>
        </TouchableOpacity>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 110,
    backgroundColor: '#FFFFFF',
  },
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    color: '#6B7280',
    lineHeight: 22,
  },
  label: {
    color: '#374151',
    fontWeight: '800',
    marginBottom: 8,
    marginTop: 6,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 14,
    textAlignVertical: 'top',
  },
  textArea: {
    minHeight: 130,
  },
  pickerCard: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 18,
    marginBottom: 14,
    overflow: 'hidden',
  },
  attachmentsCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 18,
    padding: 14,
    marginBottom: 4,
  },
  attachmentHint: {
    color: '#486581',
    lineHeight: 20,
    marginBottom: 6,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#E7EEF6',
  },
  attachmentMeta: {
    flex: 1,
    paddingRight: 12,
  },
  attachmentName: {
    color: '#15324B',
    fontWeight: '700',
  },
  attachmentType: {
    color: '#486581',
    marginTop: 2,
    fontSize: 12,
  },
  removeText: {
    color: '#B42318',
    fontWeight: '700',
  },
  primaryButton: {
    backgroundColor: '#2563EB',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 18,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  secondaryButtonText: {
    color: '#15324B',
    fontWeight: '700',
  },
});
