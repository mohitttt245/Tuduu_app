import { Sparkles } from 'lucide-react';

export default function LoadingScreen() {
  return (
    <div className="grid min-h-screen place-items-center bg-canvas">
      <div className="flex items-center gap-3 text-sm font-semibold text-slate-500">
        <Sparkles className="animate-pulse text-violet-500" size={19} /> Getting your workspace ready
      </div>
    </div>
  );
}
