import { useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { AuthButton, AuthInput, AuthLayout, a } from '../../components/AuthUI';
import { registerAccount } from '../../services/auth';
import { validateAuthForm } from '../../utils/authValidation.cjs';
export default function RegisterScreen({ navigation }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [failure, setFailure] = useState('');
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  function change(field, value) { setForm(current => ({ ...current, [field]: value })); setErrors(current => ({ ...current, [field]: undefined })); setFailure(''); }
  async function submit() {
    if (lock.current) return;
    const fields = validateAuthForm(form, true); setErrors(fields); setFailure('');
    if (Object.keys(fields).length) return;
    lock.current = true; setBusy(true);
    try {
      await registerAccount({ name: form.name.trim(), email: form.email.trim().toLowerCase(), password: form.password });
      navigation.popTo('Login', { email: form.email.trim().toLowerCase(), registered: true });
    } catch (error) { setErrors(error.response?.data?.errors || {}); setFailure(error.response?.data?.message || 'Unable to create your account. Check your connection and try again.'); }
    finally { lock.current = false; setBusy(false); }
  }
  return <AuthLayout title="Create your account" subtitle="Join your community. Make your reports count.">
    <View style={a.card}><AuthInput label="Full name" icon="person-outline" placeholder="Your name" value={form.name} onChangeText={value => change('name', value)} autoComplete="name" maxLength={100} error={errors.name} disabled={busy} /><AuthInput label="Email address" icon="mail-outline" placeholder="you@example.com" value={form.email} onChangeText={value => change('email', value)} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" maxLength={254} error={errors.email} disabled={busy} /><AuthInput label="Password" icon="lock-closed-outline" placeholder="At least 8 characters" value={form.password} onChangeText={value => change('password', value)} password autoCapitalize="none" autoComplete="new-password" error={errors.password} disabled={busy} /><AuthInput label="Confirm password" icon="lock-closed-outline" placeholder="Enter password again" value={form.confirmPassword} onChangeText={value => change('confirmPassword', value)} password autoCapitalize="none" autoComplete="new-password" error={errors.confirmPassword} disabled={busy} onSubmitEditing={submit} />{!!failure && <Text accessibilityLiveRegion="polite" style={a.error}>{failure}</Text>}<AuthButton title="Create account" onPress={submit} busy={busy} /></View>
    <View style={a.switchRow}><Text style={a.switchText}>Already have an account?</Text><Pressable accessibilityRole="button" disabled={busy} onPress={() => navigation.popTo('Login')} style={a.touch}><Text style={a.link}>Log in</Text></Pressable></View>
  </AuthLayout>;
}
