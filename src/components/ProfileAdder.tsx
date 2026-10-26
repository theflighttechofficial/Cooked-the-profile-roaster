import { ArrowRight, Loader2, TriangleAlert } from 'lucide-react';
import { useId, useState } from 'react';
import type { ConnectorInfo, Profile } from '../../shared/types.ts';
import { api } from '../lib/api.ts';
import { PlatformPicker } from './PlatformPicker.tsx';

interface Props {
  connectors: ConnectorInfo[];
  platform: ConnectorInfo | undefined;
  onPlatform: (c: ConnectorInfo) => void;
  onAdd: (p: Profile) => void;
  disabled?: boolean;
  cta?: string;
}

export function ProfileAdder({ connectors, platform, onPlatform, onAdd, disabled, cta = 'Fetch' }: Props) {
  const inputId = useId();
  const [handle, setHandle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (value = handle) => {
    if (!platform || !value.trim() || loading) return;
    setLoading(true);
    setError('');
    try {
      const p = await api.profile(platform.id, value.trim());
      onAdd(p);
      setHandle('');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    // Own stacking layer so the platform dropdown sits above the cards and buttons below it
    <div className="relative z-30">
      <form
        onSubmit={(e) => { e.preventDefault(); submit(); }}
        className="flex flex-col gap-2 rounded-3xl border border-white/10 bg-soot/80 p-2 backdrop-blur sm:flex-row"
      >
        <PlatformPicker connectors={connectors} value={platform} onChange={(c) => { onPlatform(c); setError(''); }} />
        <label className="sr-only" htmlFor={inputId}>{platform?.inputLabel ?? 'Username'}</label>
        <input
          id={inputId}
          data-handle-input
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          placeholder={platform ? `${platform.inputLabel} — e.g. ${platform.placeholder}` : 'Username or profile URL'}
          autoComplete="off"
          spellCheck={false}
          disabled={disabled}
          className="h-14 min-w-0 flex-1 rounded-2xl bg-transparent px-4 font-mono text-[15px] outline-none placeholder:font-sans placeholder:text-dust/60 focus:bg-ash/60"
        />
        <button
          type="submit"
          disabled={!platform || !handle.trim() || loading || disabled}
          className="bg-fire flex h-14 items-center justify-center gap-2 rounded-2xl px-6 font-display text-lg font-bold text-char transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? <Loader2 className="size-5 animate-spin" /> : <>{cta} <ArrowRight className="size-5" /></>}
        </button>
      </form>
      <div className="mt-2 flex min-h-6 flex-wrap items-center gap-x-3 px-3 text-sm">
        {error ? (
          <span className="flex items-center gap-1.5 text-[#ff8a7a]" role="alert">
            <TriangleAlert className="size-4 shrink-0" /> {error}
          </span>
        ) : (
          platform && (
            <span className="text-dust">
              Pulls: {platform.pulls}.{' '}
              <button type="button" onClick={() => { setHandle(platform.example); submit(platform.example); }} className="text-flame underline-offset-4 hover:underline">
                Try @{platform.example}
              </button>
            </span>
          )
        )}
      </div>
    </div>
  );
}
