import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, UserRound } from 'lucide-react';
import Brand from '../components/Brand.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getErrorMessage } from '../services/api.js';

export default function AuthPage({ mode }) {
  const isRegister = mode === 'register';
  const { user, checkingSession, signIn, register } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [values, setValues] = useState({ name: '', email: '', password: '', confirmPassword: '', remember: false });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (checkingSession) return null;
  if (user) return <Navigate to="/" replace />;

  function update(event) {
    const { name, value, checked, type } = event.target;
    setValues((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
    if (error) setError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    if (isRegister && values.password !== values.confirmPassword) {
      setError('Those passwords do not match yet.');
      return;
    }
    setSubmitting(true);
    try {
      if (isRegister) await register({ name: values.name, email: values.email, password: values.password, confirmPassword: values.confirmPassword });
      else await signIn({ email: values.email, password: values.password, remember: values.remember });
      navigate(searchParams.get('next') || '/', { replace: true });
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-layout min-h-screen lg:grid lg:grid-cols-[1.04fr_.96fr]">
      <section className="auth-showcase hidden flex-col justify-between px-12 py-10 lg:flex xl:px-20">
        <Brand />
        <div className="relative z-10 max-w-[540px] pb-12">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/55 px-3 py-1.5 text-xs font-medium text-violet-700 backdrop-blur"><span className="h-1.5 w-1.5 rounded-full bg-violet-500" /> Your day, in focus</div>
          <h1 className="text-[52px] font-semibold leading-[1.08] tracking-[-.055em] text-ink xl:text-[64px]">Make room for<br />what <span className="text-violet-600">matters.</span></h1>
          <p className="mt-6 max-w-[420px] text-base leading-7 text-slate-600">A calmer space to plan your work, build good routines, and see your progress add up.</p>
          <div className="mt-12 flex items-center gap-3 rounded-2xl border border-white/70 bg-white/65 p-4 shadow-sm backdrop-blur">
            <div className="flex -space-x-2"><span className="avatar avatar-lilac">M</span><span className="avatar avatar-peach">✦</span><span className="avatar avatar-mint">↗</span></div>
            <div><p className="text-xs font-semibold text-ink">Small steps count.</p><p className="mt-0.5 text-[11px] text-slate-500">Start with one thing today.</p></div>
          </div>
        </div>
        <p className="text-xs text-slate-500">A little more clarity, every day.</p>
        <div className="auth-orb auth-orb-one" /><div className="auth-orb auth-orb-two" />
      </section>

      <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-[420px]">
          <div className="mb-12 lg:hidden"><Brand /></div>
          <div className="mb-9">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[.16em] text-violet-600">{isRegister ? 'Create your space' : 'Welcome back'}</p>
            <h2 className="text-[30px] font-semibold tracking-[-.04em] text-ink">{isRegister ? 'Start with a fresh page.' : 'Good to see you again.'}</h2>
            <p className="mt-2 text-sm text-slate-500">{isRegister ? 'Make an account and make today count.' : 'Sign in to pick up where you left off.'}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && <label className="form-label">Your name<span className="input-wrap"><UserRound size={17} /><input autoComplete="name" name="name" value={values.name} onChange={update} placeholder="e.g. Alex Morgan" minLength={2} maxLength={60} required /></span></label>}
            <label className="form-label">Email address<span className="input-wrap"><Mail size={17} /><input autoComplete="email" name="email" type="email" value={values.email} onChange={update} placeholder="you@example.com" required /></span></label>
            <label className="form-label">Password<span className="input-wrap"><LockKeyhole size={17} /><input autoComplete={isRegister ? 'new-password' : 'current-password'} name="password" type={showPassword ? 'text' : 'password'} value={values.password} onChange={update} placeholder={isRegister ? 'At least 8 characters' : 'Enter your password'} minLength={isRegister ? 8 : undefined} maxLength={72} required /><button type="button" className="input-action" onClick={() => setShowPassword((shown) => !shown)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></span></label>
            {isRegister && <label className="form-label">Confirm password<span className="input-wrap"><LockKeyhole size={17} /><input autoComplete="new-password" name="confirmPassword" type={showPassword ? 'text' : 'password'} value={values.confirmPassword} onChange={update} placeholder="Enter it once more" minLength={8} maxLength={72} required /></span></label>}

            {!isRegister && <div className="flex items-center justify-between pt-1"><label className="flex cursor-pointer items-center gap-2 text-xs text-slate-500"><input className="h-4 w-4 rounded border-slate-300 accent-violet-600" type="checkbox" name="remember" checked={values.remember} onChange={update} /> Keep me signed in</label><Link className="text-xs font-medium text-violet-600 hover:text-violet-700" to="/forgot-password">Forgot password?</Link></div>}
            {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-xs leading-5 text-rose-700">{error}</div>}
            <button className="primary-button mt-2 w-full" type="submit" disabled={submitting}>{submitting ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'} {!submitting && <ArrowRight size={16} />}</button>
          </form>

          <p className="mt-7 text-center text-sm text-slate-500">{isRegister ? 'Already have an account?' : 'New to Tuduu?'} <Link className="font-semibold text-violet-600 hover:text-violet-700" to={isRegister ? '/login' : '/register'}>{isRegister ? 'Sign in' : 'Create an account'}</Link></p>
          <p className="mt-12 text-center text-[11px] leading-5 text-slate-400">By continuing, you agree to use Tuduu thoughtfully and keep your account details safe.</p>
        </div>
      </section>
    </div>
  );
}
