import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Bot, Check, ChevronDown, Clock3, MessageCircle, Plus, Sparkles, Trash2, WandSparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import api, { getErrorMessage } from '../services/api.js';

const suggestions = [
  'Plan my day',
  'What should I work on first?',
  'Help me make a study plan',
  'How can I stay focused today?',
];
const modes = [
  { id: 'chat', label: 'Chat', icon: MessageCircle },
  { id: 'breakdown', label: 'Break down a task', icon: WandSparkles },
  { id: 'plan', label: 'Plan my day', icon: Clock3 },
  { id: 'priority', label: 'Suggest priorities', icon: ArrowDown },
];

export default function AssistantPage() {
  const [mode, setMode] = useState('chat');
  const [conversations, setConversations] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [taskText, setTaskText] = useState('');
  const [taskContext, setTaskContext] = useState('');
  const [breakdown, setBreakdown] = useState(null);
  const [plan, setPlan] = useState(null);
  const [priorities, setPriorities] = useState(null);
  const [applied, setApplied] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const endRef = useRef(null);

  const loadConversations = useCallback(async (selectFirst = false) => {
    setLoadingConversations(true);
    try {
      const { data } = await api.get('/ai/conversations');
      const list = data.data.conversations;
      setConversations(list);
      if (selectFirst && list.length) {
        setConversationId(list[0]._id);
        const result = await api.get(`/ai/conversations/${list[0]._id}/messages`);
        setMessages(result.data.data.messages);
      }
    } catch (requestError) { setError(getErrorMessage(requestError)); }
    finally { setLoadingConversations(false); }
  }, []);

  useEffect(() => { loadConversations(true); }, [loadConversations]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [messages, loading]);

  async function selectConversation(id) {
    setConversationId(id);
    setMode('chat');
    setError(''); setNotice(''); setMessages([]);
    try {
      const { data } = await api.get(`/ai/conversations/${id}/messages`);
      setMessages(data.data.messages);
    } catch (requestError) { setError(getErrorMessage(requestError)); }
  }

  function startNewConversation() {
    setConversationId(null); setMessages([]); setMode('chat'); setError(''); setNotice('');
  }

  async function sendMessage(text = message) {
    const content = text.trim();
    if (!content || loading) return;
    setLoading(true); setError(''); setNotice(''); setMessage('');
    try {
      const { data } = await api.post('/ai/chat', { content, conversationId: conversationId || undefined });
      const newMessages = data.data.messages;
      setConversationId(data.data.conversation._id);
      setMessages((current) => [...current, ...newMessages]);
      setConversations((current) => [data.data.conversation, ...current.filter((item) => item._id !== data.data.conversation._id)].slice(0, 30));
    } catch (requestError) { setError(getErrorMessage(requestError)); setMessage(content); }
    finally { setLoading(false); }
  }

  async function breakTask(event) {
    event.preventDefault();
    setLoading(true); setError(''); setNotice(''); setBreakdown(null);
    try {
      const { data } = await api.post('/ai/break-task', { task: taskText, context: taskContext || undefined });
      setBreakdown(data.data);
    } catch (requestError) { setError(getErrorMessage(requestError)); }
    finally { setLoading(false); }
  }

  async function createBrokenTask() {
    if (!breakdown) return;
    setLoading(true); setError('');
    try {
      await api.post('/tasks', { title: breakdown.suggestedTitle, description: taskContext, subtasks: breakdown.subtasks.map((title) => ({ title, completed: false })) });
      setNotice('Task created with its suggested steps.');
      setBreakdown(null); setTaskText(''); setTaskContext('');
    } catch (requestError) { setError(getErrorMessage(requestError)); }
    finally { setLoading(false); }
  }

  async function makePlan() {
    setLoading(true); setError(''); setNotice(''); setPlan(null);
    try { const { data } = await api.post('/ai/plan-day'); setPlan(data.data); }
    catch (requestError) { setError(getErrorMessage(requestError)); }
    finally { setLoading(false); }
  }

  async function suggestPriorities() {
    setLoading(true); setError(''); setNotice(''); setPriorities(null); setApplied({});
    try { const { data } = await api.post('/ai/prioritize'); setPriorities(data.data.suggestions); }
    catch (requestError) { setError(getErrorMessage(requestError)); }
    finally { setLoading(false); }
  }

  async function applyPriority(item) {
    setError('');
    try {
      await api.put(`/tasks/${item.taskId}`, { priority: item.priority });
      setApplied((current) => ({ ...current, [item.taskId]: true }));
    } catch (requestError) { setError(getErrorMessage(requestError)); }
  }

  async function clearConversation() {
    if (!conversationId || !window.confirm('Delete this conversation and its messages?')) return;
    try {
      await api.delete(`/ai/conversations/${conversationId}`);
      setConversations((current) => current.filter((item) => item._id !== conversationId));
      startNewConversation();
      setNotice('Conversation deleted.');
    } catch (requestError) { setError(getErrorMessage(requestError)); }
  }

  return <div className="space-y-6">
    <div><p className="text-xs font-medium text-slate-400">A thoughtful planning partner</p><h1 className="mt-2 text-[30px] font-semibold tracking-[-.045em] text-ink">AI Assistant</h1><p className="mt-1 text-sm text-slate-500">Get ideas, shape your tasks, and keep the final say.</p></div>
    {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">{error}</div>}
    {notice && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700" role="status">{notice}</div>}
    <div className="assistant-layout">
      <aside className="panel assistant-history">
        <div className="mb-3 flex items-center justify-between"><h2 className="section-title">Conversations</h2><button className="icon-button" aria-label="Start a new conversation" title="New conversation" onClick={startNewConversation}><Plus size={16} /></button></div>
        <button className={`assistant-history-item ${!conversationId ? 'assistant-history-active' : ''}`} onClick={startNewConversation}><Plus size={15} />New chat</button>
        {loadingConversations ? <div className="mt-3 space-y-2"><div className="skeleton h-9" /><div className="skeleton h-9" /></div> : conversations.map((item) => <button key={item._id} className={`assistant-history-item ${conversationId === item._id ? 'assistant-history-active' : ''}`} onClick={() => selectConversation(item._id)}><MessageCircle size={14} /><span className="truncate">{item.title}</span></button>)}
      </aside>
      <section className="panel assistant-main">
        <div className="assistant-tabs" role="tablist" aria-label="Assistant tools">{modes.map(({ id, label, icon: Icon }) => <button key={id} role="tab" aria-selected={mode === id} className={`assistant-tab ${mode === id ? 'assistant-tab-active' : ''}`} onClick={() => { setMode(id); setError(''); setNotice(''); }}><Icon size={14} /><span>{label}</span></button>)}</div>
        {mode === 'chat' && <>
          <div className="assistant-chat-toolbar"><span className="flex items-center gap-2 text-xs font-semibold text-slate-600"><span className="assistant-bot-icon"><Bot size={16} /></span>Your Tuduu assistant</span>{conversationId && <button className="icon-button icon-button-danger" aria-label="Delete conversation" title="Delete conversation" onClick={clearConversation}><Trash2 size={15} /></button>}</div>
          <div className="assistant-messages" aria-live="polite">
            {!messages.length && <div className="assistant-welcome"><span className="assistant-welcome-icon"><Sparkles size={20} /></span><h2 className="mt-3 text-base font-semibold text-ink">What would help today?</h2><p className="mt-1 text-xs text-slate-500">Ask a question or choose a starting point.</p><div className="assistant-prompts">{suggestions.map((prompt) => <button key={prompt} onClick={() => sendMessage(prompt)}>{prompt}<ArrowUp size={13} /></button>)}</div></div>}
            {messages.map((item) => <article className={`assistant-message assistant-message-${item.role}`} key={item._id || `${item.role}-${item.createdAt}`}><span className="assistant-message-icon">{item.role === 'assistant' ? <Bot size={15} /> : 'You'}</span><div className="assistant-message-content"><p className="assistant-role-name">{item.role === 'assistant' ? 'Tuduu' : 'You'}</p><p className="assistant-message-text">{item.content}</p></div></article>)}
            {loading && <div className="assistant-thinking"><span className="assistant-message-icon"><Bot size={15} /></span><span>Tuduu is thinking…</span></div>}
            <div ref={endRef} />
          </div>
          <form className="assistant-compose" onSubmit={(event) => { event.preventDefault(); sendMessage(); }}><textarea aria-label="Message the assistant" placeholder="Ask Tuduu anything about your productivity…" maxLength={4000} rows={2} value={message} onChange={(event) => setMessage(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); sendMessage(); } }} /><button className="primary-button !h-10 !w-10 !px-0" disabled={loading || !message.trim()} aria-label="Send message"><ArrowUp size={17} /></button></form>
          <p className="assistant-footnote">AI suggestions can be wrong. Review them before adding or applying changes.</p>
        </>}
        {mode === 'breakdown' && <div className="assistant-tool-panel"><div><h2 className="section-title">Break a task into steps</h2><p className="section-subtitle">Turn a broad goal into a parent task with practical subtasks.</p></div><form className="mt-5 space-y-4" onSubmit={breakTask}><label className="form-label">What do you need to do?<input className="settings-input" value={taskText} onChange={(event) => setTaskText(event.target.value)} maxLength={500} required placeholder="Build a portfolio website" /></label><label className="form-label">Add context <span className="font-normal text-slate-400">Optional</span><textarea className="settings-input min-h-[88px] resize-y py-3" value={taskContext} onChange={(event) => setTaskContext(event.target.value)} maxLength={1000} placeholder="Deadline, time available, or constraints" /></label><button className="primary-button !h-10 !w-auto" disabled={loading}>{loading ? 'Thinking…' : 'Suggest steps'}</button></form>
          {breakdown && <div className="assistant-result"><p className="text-[10px] font-bold uppercase tracking-[.12em] text-violet-600">Suggested task</p><h3 className="mt-1 text-sm font-semibold text-ink">{breakdown.suggestedTitle}</h3><ol className="assistant-step-list">{breakdown.subtasks.map((item, index) => <li key={`${index}-${item}`}><span>{index + 1}</span>{item}</li>)}</ol><button className="primary-button mt-4 !h-10 !w-auto" onClick={createBrokenTask} disabled={loading}><Check size={15} /> Add task with these subtasks</button></div>}
        </div>}
        {mode === 'plan' && <div className="assistant-tool-panel"><div className="flex items-start justify-between gap-3"><div><h2 className="section-title">Plan my day</h2><p className="section-subtitle">Tuduu will order your pending tasks using due dates and priorities.</p></div><button className="primary-button !h-10 !w-auto" onClick={makePlan} disabled={loading}>{loading ? 'Planning…' : 'Build my plan'}</button></div>
          {plan && <div className="assistant-result">{plan.note && <p className="mb-4 text-xs leading-5 text-slate-500">{plan.note}</p>}{plan.plan.length ? <ol className="assistant-plan-list">{plan.plan.map((item) => <li key={item.taskId}><span className="assistant-plan-number">{item.order}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><Link className="truncate text-xs font-semibold text-ink hover:text-violet-600" to="/tasks?view=all">{item.title}</Link><span className={`priority-pill priority-${item.priority}`}>{item.priority}</span>{item.dueDate && <time className="text-[10px] text-slate-400">Due {new Date(item.dueDate).toLocaleString()}</time>}</div><p className="mt-1 text-[11px] text-slate-500">{item.reason}</p></div></li>)}</ol> : <Link to="/tasks?view=all&new=1" className="secondary-button">Add a task</Link>}</div>}
        </div>}
        {mode === 'priority' && <div className="assistant-tool-panel"><div className="flex items-start justify-between gap-3"><div><h2 className="section-title">Priority suggestions</h2><p className="section-subtitle">Review each suggestion and choose whether to apply it.</p></div><button className="primary-button !h-10 !w-auto" onClick={suggestPriorities} disabled={loading}>{loading ? 'Reviewing…' : 'Review pending tasks'}</button></div>
          {priorities && <div className="assistant-priority-list">{priorities.length ? priorities.map((item) => <article className="assistant-priority-item" key={item.taskId}><div className="min-w-0 flex-1"><h3 className="truncate text-xs font-semibold text-ink">{item.title}</h3><p className="mt-1 text-[11px] text-slate-500">{item.reason}</p><p className="mt-1 text-[10px] text-slate-400">Current: {item.currentPriority} · Suggested: {item.priority}</p></div><button className="secondary-button shrink-0" onClick={() => applyPriority(item)} disabled={applied[item.taskId] || item.priority === item.currentPriority}>{applied[item.taskId] ? <><Check size={14} />Applied</> : item.priority === item.currentPriority ? 'Keep priority' : <>Apply <ChevronDown size={13} /></>}</button></article>) : <p className="text-xs text-slate-500">No pending tasks to prioritize yet.</p>}</div>}
        </div>}
      </section>
    </div>
  </div>;
}
