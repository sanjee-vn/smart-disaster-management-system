import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Card, Icon, ui } from './UI';
import { colors as c } from '../theme';
import { isPhotoUrl } from '../utils/reportValidation.cjs';

export default function PhotoReference({ value, onChange, error, disabled }) {
  const [preview, setPreview] = useState('');
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => { setPreview(isPhotoUrl(value.trim()) ? value.trim() : ''); setFailed(false); }, 600);
    return () => clearTimeout(timer);
  }, [value]);
  return <Card><View style={ui.row}><Icon name="image-outline" /><Text style={ui.sectionTitle}>Photo · optional</Text></View><Text style={ui.muted}>Have a photo hosted online? Attach its link. Camera and gallery uploads are not available yet.</Text><TextInput accessibilityLabel="Optional photo URL" placeholder="https://example.com/incident.jpg" placeholderTextColor={c.muted} value={value} onChangeText={onChange} editable={!disabled} autoCapitalize="none" autoCorrect={false} keyboardType="url" maxLength={2048} style={styles.input} />{error && <Text style={styles.error}>{error}</Text>}{preview && !failed && <Image accessibilityLabel="Attached photo preview" source={{ uri: preview }} style={styles.photo} resizeMode="cover" onError={() => setFailed(true)} />}{preview && failed && <Text style={ui.muted}>Preview unavailable. Confirm that the link points to an accessible image.</Text>}{!!value && <Pressable disabled={disabled} accessibilityRole="button" onPress={() => onChange('')} style={styles.remove}><Text style={ui.link}>Remove photo link</Text></Pressable>}</Card>;
}
const styles = StyleSheet.create({ input: { minHeight: 50, padding: 13, backgroundColor: '#F8FAFA', color: c.text, borderColor: c.border, borderWidth: 1, borderRadius: 12, fontSize: 13 }, photo: { width: '100%', height: 180, borderRadius: 12 }, error: { color: c.error, fontSize: 12 }, remove: { minHeight: 44, justifyContent: 'center' } });
