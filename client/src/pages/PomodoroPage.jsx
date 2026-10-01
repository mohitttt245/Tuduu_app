import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pause, Play, RotateCcw, SkipForward, Timer, Volume2 } from 'lucide-react';
import api, { getErrorMessage } from '../services/api.js';

const DEFAULTS = { focus: 25, shortBreak: 5, longBreak: 15 };
const MODE_LABELS = { focus: 'Focus', shortBreak: 'Short break', longBreak: 'Long break' };
const secondsFor = (mode, settings) => (settings[mode] || settings.focus) * 60;

function readSettings() {
  try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem('tuduu-pomodoro-settings') || localStorage.getItem('orbit-pomodoro-settings') || '{}') }; }
  catch { return DEFAULTS; }
}

export default function PomodoroPage() {
  const [settings, setSettings] = useState(readSettings);
  const [mode, setMode] = useState('focus');
  const [secondsLeft, setSecondsLeft] = useState(() => secondsFor('focus', readSettings()));
  const [running, setRunning] = useState(false);
  const [round, setRound] = useState(0);
  const [tasks, setTasks] = useState([]);
  const [taskId, setTaskId] = useState('');
  const [sessions, setSessions] = useState([]);
  const [totals, setTotals] = useState({ total: 0, focusMinutes: 0 });
  const [finishedPhase, setFinishedPhase] = useState(0);
  const [pendingSave, setPendingSave] = useState(null);
  const [error, setError] = useState('');

  const loadHistory = useCallback(async () => {
    const { data } = await api.get('/pomodoro', { params: { limit: 8 } });
    setSessions(data.data.sessions);
    setTotals({ total: data.data.total, focusMinutes: data.data.totalFocusMinutes });
  }, []);

  useEffect(() => {
    Promise.all([api.get('/tasks', { params: { view: 'all', status: 'pending', limit: 100 } }), loadHistory()])
      .then(([taskResponse]) => setTasks(taskResponse.data.data.tasks))
      .catch((requestError) => setError(getErrorMessage(requestError)));
  }, [loadHistory]);

  useEffect(() => {
    if (!running) return undefined;
    const timer = window.setTimeout(() => {
      if (secondsLeft <= 1) {
        setSecondsLeft(0);
        setRunning(false);
        setFinishedPhase((current) => current + 1);
      } else setSecondsLeft((current) => current - 1);
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [running, secondsLeft]);

  useEffect(() => {
    if (!finishedPhase) return;
    if (mode === 'focus') {
      const focusMinutes = settings.focus;
      const nextRound = round + 1;
      setRound(nextRound);
      setPendingSave({ focusMinutes, breakMinutes: nextRound % 4 === 0 ? settings.longBreak : settings.shortBreak, taskId: taskId || null });
      setMode(nextRound % 4 === 0 ? 'longBreak' : 'shortBreak');
      setSecondsLeft(secondsFor(nextRound % 4 === 0 ? 'longBreak' : 'shortBreak', settings));
    } else {
      setMode('focus');
      setSecondsLeft(secondsFor('focus', settings));
    }
  }, [finishedPhase]);

  useEffect(() => { localStorage.setItem('tuduu-pomodoro-settings', JSON.stringify(settings)); }, [settings]);

  async function saveFinishedSession() {
    if (!pendingSave) return;
    setError('');
    try {
      await api.post('/pomodoro', pendingSave);
      setPendingSave(null);
      await loadHistory();
    } catch (requestError) { setError(`Timer finished, but the session could not be saved. ${getErrorMessage(requestError)}`); }
  }

  useEffect(() => { if (pendingSave) saveFinishedSession(); }, [pendingSave]);

  const totalSeconds = secondsFor(mode, settings);
  const progress = totalSeconds ? (totalSeconds - secondsLeft) / totalSeconds : 0;
  const timeText = useMemo(() => `${String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:${String(secondsLeft % 60).padStart(2, '0')}`, [secondsLeft]);

  function changeMode(nextMode) { setRunning(false); setMode(nextMode); setSecondsLeft(secondsFor(nextMode, settings)); }
  function updateSetting(name, value) {
    const amount = Math.min(name === 'focus' ? 180 : 60, Math.max(1, Number(value) || 1));
    setSettings((current) => ({ ...current, [name]: amount }));
    if (!running && mode === name) setSecondsLeft(amount * 60);
  }
  function skip() {
    if (mode === 'focus') changeMode((round + 1) % 4 === 0 ? 'longBreak' : 'shortBreak');
    else changeMode('focus');
  }

  return <div className="space-y-6">
    <div><p className="text-xs font-medium text-slate-400">One thing at a time</p><h1 className="mt-2 text-[30px] font-semibold tracking-[-.045em] text-ink">Focus timer</h1><p className="mt-1 text-sm text-slate-500">A little focus, then a proper pause.</p></div>
    {error && <div role="alert" className="flex flex-wrap items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"><span className="flex-1">{error}</span>{pendingSave && <button className="text-xs font-semibold underline" onClick={saveFinishedSession}>Retry save</button>}</div>}
    <div className="grid gap-4 xl:grid-cols-[1.2fr_.8fr]">
      <section className="panel pomodoro-main"><div className="flex flex-wrap items-center justify-center gap-2">{Object.entries(MODE_LABELS).map(([key, label]) => <button key={key} className={`pomodoro-mode ${mode === key ? 'pomodoro-mode-active' : ''}`} onClick={() => changeMode(key)}>{label}</button>)}</div>
        <div className="pomodoro-clock" style={{ '--timer-progress': `${progress * 100}%` }}><div className="pomodoro-clock-inner"><span className="text-[54px] font-semibold tracking-[-.06em] text-ink sm:text-[64px]">{timeText}</span><span className="mt-1 text-xs font-medium uppercase tracking-[.18em] text-slate-400">{MODE_LABELS[mode]}</span></div></div>
        <label className="mx-auto flex max-w-[390px] flex-col gap-2 text-xs font-semibold text-slate-500">Working on<select className="settings-input" value={taskId} onChange={(event) => setTaskId(event.target.value)}><option value="">No linked task</option>{tasks.map((task) => <option key={task._id} value={task._id}>{task.title}</option>)}</select></label>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2"><button className="primary-button !h-11 !w-[150px]" onClick={() => setRunning((current) => !current)}>{running ? <><Pause size={16} /> Pause</> : <><Play size={16} fill="currentColor" /> {secondsLeft === totalSeconds ? 'Start focus' : 'Resume'}</>}</button><button className="secondary-button !h-11" onClick={() => { setRunning(false); setSecondsLeft(totalSeconds); }}><RotateCcw size={15} /> Reset</button><button className="secondary-button !h-11" onClick={skip}><SkipForward size={15} /> Skip</button></div>
        <div className="mt-5 flex items-center justify-center gap-2 text-[11px] text-slate-400"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-50 text-violet-600"><Timer size={12} /></span>Session {round + 1} of 4 <span className="mx-1">·</span> Long break every 4 focus sessions</div>
      </section>
      <div className="space-y-4"><section className="panel"><div className="mb-5"><h2 className="section-title">Timer settings</h2><p className="section-subtitle">Your preferences stay on this device</p></div><div className="space-y-3">{[['focus', 'Focus'], ['shortBreak', 'Short break'], ['longBreak', 'Long break']].map(([key, label]) => <label className="flex items-center justify-between gap-3 text-xs font-medium text-slate-600" key={key}>{label}<span className="flex items-center gap-2"><input className="settings-input !h-9 !w-[76px] text-center" type="number" min="1" max={key === 'focus' ? 180 : 60} value={settings[key]} onChange={(event) => updateSetting(key, event.target.value)} disabled={running} /><span className="text-[10px] text-slate-400">min</span></span></label>)}</div><div className="mt-4 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-[10px] leading-4 text-amber-800"><Volume2 size={13} /> Keep this tab open while a timer is running.</div></section>
        <section className="panel"><div className="flex items-start justify-between"><div><h2 className="section-title">Focus so far</h2><p className="section-subtitle">Completed sessions saved to your account</p></div><div className="stat-icon stat-violet"><Timer size={17} /></div></div><div className="mt-4 grid grid-cols-2 gap-3"><div className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] text-slate-400">Sessions</p><p className="mt-1 text-xl font-semibold text-ink">{totals.total}</p></div><div className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] text-slate-400">Focus time</p><p className="mt-1 text-xl font-semibold text-ink">{Math.floor(totals.focusMinutes / 60)}h {totals.focusMinutes % 60}m</p></div></div>{sessions.length > 0 && <div className="mt-3 space-y-2">{sessions.slice(0, 4).map((session) => <div className="flex justify-between gap-3 text-[10px] text-slate-500" key={session._id}><span className="truncate">{session.taskId?.title || 'Focus session'}</span><span className="shrink-0">{session.focusMinutes} min · {new Date(session.completedAt).toLocaleDateString()}</span></div>)}</div>}</section></div>
    </div>
  </div>;
}
