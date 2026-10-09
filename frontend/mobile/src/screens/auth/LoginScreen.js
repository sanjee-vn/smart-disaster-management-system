import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Pressable, Text, View } from 'react-native';
import { AuthButton, AuthInput, AuthLayout, a } from '../../components/AuthUI';
import { useAuth } from '../../context/AuthContext';
import { validateAuthForm } from '../../utils/authValidation.cjs';
export default function LoginScreen({ route, navigation }) {
  const { login, busy, sessionMessage } = useAuth();
  const [form, setForm] = useState({ email: route.params?.email || '', password: '' });
  const [errors, setErrors] = useState({});
  const [failure, setFailure] = useState('');
  const lock = useRef(false);
  const registrationEmail = route.params?.registered ? route.params?.email : null;
  useFocusEffect(useCallback(() => {
    if (registrationEmail) setForm({ email: registrationEmail, password: '' });
  }, [registrationEmail]));
  function change(field, value) { setForm(current => ({ ...current, [field]: value })); setErrors(current => ({ ...current, [field]: undefined })); setFailure(''); }
  async function submit() {
    if (lock.current) return;
    const fields = validateAuthForm(form); setErrors(fields); setFailure('');
    if (Object.keys(fields).length) return;
    lock.current = true;
    try { await login({ email: form.email.trim().toLowerCase(), password: form.password }); }
    catch (error) { setErrors(error.response?.data?.errors || {}); setFailure(error.response?.data?.message || error.message || 'Unable to log in. Check your connection.'); }
    finally { lock.current = false; }
  }
  return <AuthLayout title="Welcome back" subtitle="Log in to report incidents and view your activity.">
    {!!(route.params?.registered || sessionMessage) && <View style={a.message}><Text style={a.messageText}>{route.params?.registered ? 'Account created. Log in to continue.' : sessionMessage}</Text></View>}
    <View style={a.card}><AuthInput label="Email address" icon="mail-outline" placeholder="you@example.com" value={form.email} onChangeText={value => change('email', value)} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" error={errors.email} disabled={busy} maxLength={254} /><AuthInput label="Password" icon="lock-closed-outline" placeholder="Enter your password" value={form.password} onChangeText={value => change('password', value)} password autoCapitalize="none" autoComplete="current-password" error={errors.password} disabled={busy} onSubmitEditing={submit} />{!!failure && <Text accessibilityLiveRegion="polite" style={a.error}>{failure}</Text>}<AuthButton title="Log in" onPress={submit} busy={busy} /></View>
    <View style={a.switchRow}><Text style={a.switchText}>New to ResQConnect?</Text><Pressable accessibilityRole="button" disabled={busy} onPress={() => navigation.navigate('Register')} style={a.touch}><Text style={a.link}>Create account</Text></Pressable></View><Text style={a.footer}>Stay safe. Stay connected.</Text>
  </AuthLayout>;
}
