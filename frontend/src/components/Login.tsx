import { type FormEvent, useState } from 'react'
import { signIn, signUp, type User } from '../api'
import { Cat } from './Characters'
import CityBackdrop from './CityBackdrop'

export default function Login({ onSignedIn }: { onSignedIn: (u: User) => void }) {
  const [mode, setMode] = useState<'in' | 'up'>('in')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (mode === 'up' && password.length < 8) return setError('Use at least 8 characters for your password.')
    setBusy(true)
    try {
      const user = mode === 'up' ? await signUp(name, email, password) : await signIn(email, password)
      onSignedIn(user)
    } catch (err) {
      setError(err instanceof TypeError ? 'Could not reach the backend. Is it running?' : (err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const switchTo = (m: 'in' | 'up') => { setMode(m); setError('') }

  return (
    <div className="login">
      <CityBackdrop />
      <div className="login-card">
        <div className="login-cats"><Cat who="luna" size={52} /><Cat who="artemis" size={52} /></div>
        <p className="eyebrow">Yale School of Management · Fall 2026</p>
        <h1>Course Explorer</h1>
        <p className="login-sub">
          {mode === 'in' ? 'Welcome back! Luna and Artemis saved your chat.' : 'Make an account so Luna and Artemis can remember your chats.'}
        </p>

        <div className="segmented login-tabs">
          <button className={mode === 'in' ? 'on' : ''} onClick={() => switchTo('in')} type="button">Sign in</button>
          <button className={mode === 'up' ? 'on' : ''} onClick={() => switchTo('up')} type="button">Create account</button>
        </div>

        <form onSubmit={submit} className="login-form">
          {mode === 'up' && (
            <label>Name
              <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
            </label>
          )}
          <label>Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
          </label>
          <label>Password
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'up' ? 'new-password' : 'current-password'} required />
            {mode === 'up' && <span className="hint">At least 8 characters.</span>}
          </label>
          {error && <p className="login-error">{error}</p>}
          <button className="login-submit" disabled={busy}>
            {busy ? <span className="spinner light" /> : mode === 'in' ? 'Sign in' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  )
}
