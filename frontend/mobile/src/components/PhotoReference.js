import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Card, Icon, ui } from './UI';
import { colors as c } from '../theme';

export default function PhotoReference({ value, onChange, error, disabled }) {
  const [failure, setFailure] = useState('');
  const [picking, setPicking] = useState(false);
  async function choose(camera) {
    if (disabled || picking) return;
    setPicking(true); setFailure('');
    try {
      if (camera) {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) { setFailure('Allow camera access in your phone settings to take a photo.'); return; }
      }
      const options = { mediaTypes: ['images'], allowsEditing: true, quality: 0.7 };
      const result = camera ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
      if (result.canceled) return;
      const asset = result.assets[0];
      if (asset.fileSize > 5 * 1024 * 1024) { setFailure('Choose a photo smaller than 5 MB.'); return; }
      onChange(asset);
    } catch { setFailure('Unable to open photos. Please try again.'); }
    finally { setPicking(false); }
  }
  return <Card><View style={ui.row}><Icon name="image-outline"/><Text style={ui.sectionTitle}>Photo (optional)</Text></View><Text style={ui.muted}>Attach a photo from your gallery or take one. JPEG, PNG or WebP, up to 5 MB.</Text><View style={styles.buttons}>{[['Choose photo', false], ['Take photo', true]].map(([label, camera]) => <Pressable key={label} accessibilityRole="button" disabled={disabled || picking} onPress={() => choose(camera)} style={styles.button}><Text style={ui.link}>{label}</Text></Pressable>)}</View>{!!(error || failure) && <Text style={styles.error}>{error || failure}</Text>}{value && <><Image accessibilityLabel="Selected incident photo" source={{ uri: value.uri }} style={styles.photo}/><Pressable accessibilityRole="button" disabled={disabled || picking} onPress={() => { onChange(null); setFailure(''); }} style={styles.button}><Text style={ui.link}>Remove photo</Text></Pressable></>}</Card>;
}
const styles = StyleSheet.create({ buttons: { flexDirection: 'row', gap: 12 }, button: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 12, borderWidth: 1, borderColor: c.border, borderRadius: 12 }, photo: { width: '100%', height: 180, borderRadius: 12 }, error: { color: c.error, fontSize: 12 } });
