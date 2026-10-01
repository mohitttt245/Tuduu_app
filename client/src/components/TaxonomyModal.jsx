import { useState } from 'react';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import api, { getErrorMessage } from '../services/api.js';

export default function TaxonomyModal({ categories, tags, onClose, onChanged }) {
  const [categoryName, setCategoryName] = useState('');
  const [tagName, setTagName] = useState('');
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');

  async function saveCategory(event) {
    event.preventDefault();
    try {
      if (editing) await api.put(`/categories/${editing._id}`, { name: categoryName });
      else await api.post('/categories', { name: categoryName });
      setCategoryName(''); setEditing(null); setError(''); onChanged();
    } catch (requestError) { setError(getErrorMessage(requestError)); }
  }

  async function removeCategory(category) {
    if (!window.confirm(`Delete “${category.name}”? Tasks in this category will become uncategorized.`)) return;
    try { await api.delete(`/categories/${category._id}`); onChanged(); } catch (requestError) { setError(getErrorMessage(requestError)); }
  }

  async function saveTag(event) {
    event.preventDefault();
    try { await api.post('/tags', { name: tagName }); setTagName(''); setError(''); onChanged(); } catch (requestError) { setError(getErrorMessage(requestError)); }
  }

  async function removeTag(tag) {
    if (!window.confirm(`Delete #${tag.name}? It will be removed from your tasks.`)) return;
    try { await api.delete(`/tags/${tag._id}`); onChanged(); } catch (requestError) { setError(getErrorMessage(requestError)); }
  }

  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="modal-card modal-card-narrow" role="dialog" aria-modal="true" aria-labelledby="taxonomy-title"><div className="modal-heading"><div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-violet-600">Organize your work</p><h2 id="taxonomy-title" className="mt-1 text-xl font-semibold text-ink">Categories & tags</h2></div><button className="icon-button" onClick={onClose} aria-label="Close category and tag manager"><X size={18} /></button></div><div className="modal-body space-y-6">
    <section><h3 className="text-xs font-semibold text-slate-600">Categories</h3><form className="mt-2 flex gap-2" onSubmit={saveCategory}><input className="settings-input" maxLength={40} required value={categoryName} onChange={(event) => setCategoryName(event.target.value)} placeholder={editing ? 'Rename category' : 'New category'} /><button className="secondary-button" type="submit"><Plus size={14} />{editing ? 'Save' : 'Add'}</button>{editing && <button className="icon-button" type="button" onClick={() => { setEditing(null); setCategoryName(''); }} aria-label="Cancel rename"><X size={14} /></button>}</form><div className="mt-3 space-y-1">{categories.map((category) => <div key={category._id} className="taxonomy-row"><span className="category-dot" style={{ backgroundColor: category.color }} /> <span className="min-w-0 flex-1 truncate text-sm text-slate-600">{category.name}</span><button className="icon-button" onClick={() => { setEditing(category); setCategoryName(category.name); }} aria-label={`Rename ${category.name}`}><Pencil size={14} /></button><button className="icon-button icon-button-danger" onClick={() => removeCategory(category)} aria-label={`Delete ${category.name}`}><Trash2 size={14} /></button></div>)}</div></section>
    <section><h3 className="text-xs font-semibold text-slate-600">Tags</h3><form className="mt-2 flex gap-2" onSubmit={saveTag}><input className="settings-input" maxLength={32} required value={tagName} onChange={(event) => setTagName(event.target.value)} placeholder="e.g. urgent" /><button className="secondary-button" type="submit"><Plus size={14} />Add</button></form><div className="mt-3 flex flex-wrap gap-2">{tags.map((tag) => <span key={tag._id} className="tag-manage">#{tag.name}<button onClick={() => removeTag(tag)} aria-label={`Delete tag ${tag.name}`}><X size={12} /></button></span>)}{tags.length === 0 && <span className="text-xs text-slate-400">No tags yet.</span>}</div></section>
    {error && <p className="form-error" role="alert">{error}</p>}
  </div></section></div>;
}
