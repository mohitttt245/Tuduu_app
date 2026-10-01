import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, KeyRound, LogOut, Monitor, Moon, ShieldCheck, Sun, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import api, { getErrorMessage } from '../services/api.js';

export default function SettingsPage() {
  const { user, refreshUser, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name || '');
  const [profileState, setProfileState] = useState({ busy: false, message: '', error: '' });
  const [password, setPassword] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [passwordState, setPasswordState] = useState({ busy: false, message: '', error: '' });

  async function saveProfile(event) {
    event.preventDefault();
    setProfileState({ busy: true, message: '', error: '' });
    try {
      await api.put('/auth/profile', { name });
      await refreshUser();
      setProfileState({ busy: false, message: 'Your profile has been updated.', error: '' });
    } catch (error) {
      setProfileState({ busy: false, message: '', error: getErrorMessage(error) });
    }
  }

  async function changePassword(event) {
    event.preventDefault();
    if (password.newPassword !== password.confirm) {
      setPasswordState({ busy: false, message: '', error: 'Those new passwords do not match.' });
      return;
    }
    setPasswordState({ busy: true, message: '', error: '' });
    try {
      await api.put('/auth/change-password', { currentPassword: password.currentPassword, newPassword: password.newPassword });
      setPassword({ currentPassword: '', newPassword: '', confirm: '' });
      setPasswordState({ busy: false, message: 'Your password has been changed.', error: '' });
    } catch (error) {
      setPasswordState({ busy: false, message: '', error: getErrorMessage(error) });
    }
  }

  async function handleSignOut() {
    await signOut();
    navigate('/login', { replace: true });
  }

  return (
    <div className="mx-auto max-w-[880px] space-y-7">
      <div><p className="text-xs font-medium text-slate-400">Your account</p><h1 className="mt-2 text-[30px] font-semibold tracking-[-.045em] text-ink">Settings</h1><p className="mt-1.5 text-sm text-slate-500">Manage your profile and keep your account secure.</p></div>

      <section className="panel"><div className="mb-5 flex items-center gap-3"><span className="settings-icon"><Moon size={18} /></span><div><h2 className="section-title">Appearance</h2><p className="section-subtitle">Choose how Tuduu looks on this device</p></div></div><div className="theme-options" role="group" aria-label="Color theme">{[{ id: 'light', label: 'Light', icon: Sun }, { id: 'dark', label: 'Dark', icon: Moon }, { id: 'system', label: 'System', icon: Monitor }].map(({ id, label, icon: Icon }) => <button key={id} type="button" className={`theme-option ${theme === id ? 'theme-option-active' : ''}`} aria-pressed={theme === id} onClick={() => setTheme(id)}><Icon size={17} /><span>{label}</span>{theme === id && <Check size={14} className="ml-auto" />}</button>)}</div></section>

      <section className="panel"><div className="mb-6 flex items-center gap-3"><span className="settings-icon"><UserRound size={18} /></span><div><h2 className="section-title">Profile</h2><p className="section-subtitle">Your personal details</p></div></div>
        <form onSubmit={saveProfile} className="max-w-[540px] space-y-4"><label className="form-label">Name<input className="settings-input" autoComplete="name" minLength={2} maxLength={60} required value={name} onChange={(event) => setName(event.target.value)} /></label><label className="form-label">Email address<input className="settings-input settings-input-readonly" value={user?.email || ''} readOnly /><span className="text-[11px] font-normal text-slate-400">Email address cannot be changed here.</span></label>
          {profileState.error && <p className="form-error" role="alert">{profileState.error}</p>}{profileState.message && <p className="form-success" role="status"><Check size={14} />{profileState.message}</p>}
          <button className="primary-button !w-auto" disabled={profileState.busy}>{profileState.busy ? 'Saving…' : 'Save changes'}</button></form>
      </section>

      <section className="panel"><div className="mb-6 flex items-center gap-3"><span className="settings-icon"><KeyRound size={18} /></span><div><h2 className="section-title">Change password</h2><p className="section-subtitle">Choose a strong password you don’t use elsewhere</p></div></div>
        <form onSubmit={changePassword} className="grid max-w-[720px] gap-4 sm:grid-cols-2"><label className="form-label sm:col-span-2">Current password<input className="settings-input" type="password" autoComplete="current-password" value={password.currentPassword} onChange={(event) => setPassword({ ...password, currentPassword: event.target.value })} required /></label><label className="form-label">New password<input className="settings-input" type="password" autoComplete="new-password" minLength={8} maxLength={72} value={password.newPassword} onChange={(event) => setPassword({ ...password, newPassword: event.target.value })} required /><span className="text-[11px] font-normal text-slate-400">Use at least 8 characters.</span></label><label className="form-label">Confirm new password<input className="settings-input" type="password" autoComplete="new-password" minLength={8} maxLength={72} value={password.confirm} onChange={(event) => setPassword({ ...password, confirm: event.target.value })} required /></label>
          <div className="sm:col-span-2">{passwordState.error && <p className="form-error" role="alert">{passwordState.error}</p>}{passwordState.message && <p className="form-success" role="status"><Check size={14} />{passwordState.message}</p>}</div><button className="primary-button !w-auto sm:col-span-2 sm:justify-self-start" disabled={passwordState.busy}>{passwordState.busy ? 'Updating…' : 'Update password'}</button></form>
      </section>

      <section className="panel flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><span className="settings-icon settings-icon-green"><ShieldCheck size={18} /></span><div><h2 className="section-title">Account security</h2><p className="mt-1 max-w-[450px] text-xs leading-5 text-slate-400">Your sign-in session is stored in a protected, HTTP-only browser cookie.</p></div></div><button className="secondary-button shrink-0" onClick={handleSignOut}><LogOut size={15} /> Sign out</button></section>
      <p className="px-1 text-[11px] text-slate-400">Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : '—'}</p>
    </div>
  );
}
