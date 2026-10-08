import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, KeyRound, ShieldCheck } from 'lucide-react'
import { loginAccount, registerAccount } from '../services/authService'
import './AuthPages.css'
import './AuthPagesCleanup.css'

const roles = [
  { value: 'dmc_officer', label: 'DMC Officer' },
  { value: 'duty_officer', label: 'Duty Officer' },
  { value: 'district_officer', label: 'District Officer' },
]
const districts = ['Ampara', 'Anuradhapura', 'Badulla', 'Batticaloa', 'Colombo', 'Galle', 'Gampaha', 'Hambantota', 'Jaffna', 'Kalutara', 'Kandy', 'Kegalle', 'Kilinochchi', 'Kurunegala', 'Mannar', 'Matale', 'Matara', 'Monaragala', 'Mullaitivu', 'Nuwara Eliya', 'Polonnaruwa', 'Puttalam', 'Ratnapura', 'Trincomalee', 'Vavuniya']

export default function AuthPage({ mode, onAuthenticated }) {
  const isRegister = mode === 'register'
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'duty_officer', district: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }))
  const submit = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const session = isRegister ? await registerAccount(form) : await loginAccount({ email: form.email, password: form.password, role: form.role })
      onAuthenticated(session)
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'Could not connect to the account service.')
    } finally {
      setBusy(false)
    }
  }

  return <main className="auth-page"><section className="auth-card"><header className="auth-brand"><span className="auth-logo"><i/><i/><i/></span><span><b>SDEWS</b><small>Smart Disaster Early-Warning System</small></span></header><div className="auth-intro"><span className="auth-eyebrow"><ShieldCheck size={14}/> SECURE OPERATIONS PORTAL</span><h1>{isRegister ? 'Create your officer account' : 'Welcome back'}</h1><p>{isRegister ? 'Register an account for your disaster response role.' : 'Sign in to continue to your role-specific workspace.'}</p></div><form onSubmit={submit} className="auth-form">
    {isRegister && <label>Full name<input autoComplete="name" value={form.name} onChange={(event) => update('name', event.target.value)} required minLength={2} maxLength={100} placeholder="e.g. N. Perera"/></label>}
    <label>Email address<input type="email" autoComplete="email" value={form.email} onChange={(event) => update('email', event.target.value)} required placeholder="name@dmc.gov.lk"/></label>
    <label>Password<input type="password" autoComplete={isRegister ? 'new-password' : 'current-password'} value={form.password} onChange={(event) => update('password', event.target.value)} required minLength={isRegister ? 8 : undefined} placeholder={isRegister ? 'At least 8 characters' : 'Enter your password'}/></label>
    <label>Portal role<select value={form.role} onChange={(event) => update('role', event.target.value)}>{roles.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}</select></label>
    {isRegister && form.role === 'district_officer' && <label>District<select value={form.district} onChange={(event) => update('district', event.target.value)} required><option value="">Select your district</option>{districts.map((district) => <option key={district}>{district}</option>)}</select></label>}
    {error && <div className="auth-error" role="alert">{error}</div>}
    <button className="auth-submit" type="submit" disabled={busy}>{busy ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'}<ArrowRight size={16}/></button>
  </form><div className="auth-switch">{isRegister ? 'Already registered?' : 'Need an account?'} <Link to={isRegister ? '/login' : '/register'}>{isRegister ? 'Sign in' : 'Register'}</Link></div><div className="auth-note"><KeyRound size={14}/><span>Choose the role registered to your account. Your account role is checked by the server during sign in.</span></div></section></main>
}
