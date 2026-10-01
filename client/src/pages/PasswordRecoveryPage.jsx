import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, KeyRound, Mail } from 'lucide-react';
import Brand from '../components/Brand.jsx';
import api, { getErrorMessage } from '../services/api.js';

export default function PasswordRecoveryPage({ mode }) {
  const isReset = mode === 'reset';
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');
    setError('');
    if (isReset && password !== confirmPassword) {
      setError('Those passwords do not match yet.');
      return;
    }
    setBusy(true);
    try {
      const response = isReset
        ? await api.post('/auth/reset-password', { token, password, confirmPassword })
        : await api.post('/auth/forgot-password', { email });
      setMessage(response.data.data.message);
      if (isReset) window.setTimeout(() => navigate('/login', { replace: true }), 1400);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setBusy(false);
    }
  }

  const invalidResetLink = isReset && !token;

  return (
    <div className="auth-layout flex min-h-screen flex-col px-5 py-6 sm:px-10 sm:py-8">
      <div className="mx-auto w-full max-w-[1080px]"><Brand /></div>
      <main className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center py-10">
        <div className="mb-8"><span className="settings-icon mb-5"><KeyRound size={18} /></span><p className="mb-2 text-xs font-semibold uppercase tracking-[.16em] text-violet-600">Account recovery</p><h1 className="text-[29px] font-semibold tracking-[-.045em] text-ink">{isReset ? 'Choose a new password.' : 'Let’s get you back in.'}</h1><p className="mt-2 text-sm leading-6 text-slate-500">{isReset ? 'Create a new password for your Tuduu account.' : 'Enter the email address linked to your account and we’ll send a reset link.'}</p></div>

        {invalidResetLink ? <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">This reset link is missing its token. Request a fresh link to continue.</div> : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isReset && <label className="form-label">Email address<span className="input-wrap"><Mail size={17} /><input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></span></label>}
            {isReset && <><label className="form-label">New password<input className="settings-input" type="password" autoComplete="new-password" minLength={8} maxLength={72} required value={password} onChange={(event) => setPassword(event.target.value)} /></label><label className="form-label">Confirm new password<input className="settings-input" type="password" autoComplete="new-password" minLength={8} maxLength={72} required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} /></label></>}
            {error && <p className="form-error" role="alert">{error}</p>}
            {message && <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-xs leading-5 text-emerald-800" role="status"><CheckCircle2 size={16} className="mt-0.5 shrink-0" />{message}</div>}
            <button className="primary-button w-full" type="submit" disabled={busy || Boolean(message)}>{busy ? 'Please wait…' : isReset ? 'Reset password' : 'Send reset link'}</button>
          </form>
        )}

        <Link className="mt-7 inline-flex items-center justify-center gap-2 text-xs font-semibold text-slate-500 hover:text-violet-600" to="/login"><ArrowLeft size={14} /> Back to sign in</Link>
      </main>
      <p className="mx-auto text-center text-[11px] text-slate-400">Reset links expire after 20 minutes.</p>
    </div>
  );
}
