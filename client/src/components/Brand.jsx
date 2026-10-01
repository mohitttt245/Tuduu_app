import { Sparkles } from 'lucide-react';

export default function Brand({ compact = false }) {
  return (
    <div className="flex items-center gap-3">
      <span className="brand-mark"><Sparkles size={19} strokeWidth={2.3} /></span>
      {!compact && <span className="text-[19px] font-bold tracking-[-0.04em] text-ink">Tuduu<span className="text-violet-500">.</span></span>}
    </div>
  );
}
