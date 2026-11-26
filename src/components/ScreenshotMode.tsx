import { ImageUp, Loader2, Flame, X } from 'lucide-react';
import { useRef, useState } from 'react';
import type { Heat, Persona, Roast } from '../../shared/types.ts';
import { api, ApiError } from '../lib/api.ts';
import { readScreenshotText } from '../lib/ocr.ts';

interface Props {
  persona: Persona;
  heat: Heat;
  /** A server AI can read images. Without one, text is read on the device. */
  vision: boolean;
  controls: React.ReactNode;
  onRoast: (r: Roast) => void;
}

const MAX_BYTES = 5 * 1024 * 1024;

export function ScreenshotMode({ persona, heat, vision, controls, onRoast }: Props) {
  const [image, setImage] = useState('');
  const [note, setNote] = useState('');
  const [drag, setDrag] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState('');
  const [error, setError] = useState('');
  const input = useRef<HTMLInputElement>(null);

  const load = (file?: File | null) => {
    setError('');
    if (!file) return;
    if (!/^image\/(png|jpeg|webp|gif)$/.test(file.type)) return setError('Use a PNG, JPG, WebP or GIF.');
    if (file.size > MAX_BYTES) return setError('Keep it under 5 MB.');
    const reader = new FileReader();
    reader.onload = () => setImage(String(reader.result));
    reader.readAsDataURL(file);
  };

  // No vision model (or it failed): read the text on this device, then roast the text
  const roastFromText = async () => {
    setStage('Reading the text on your device…');
    const text = await readScreenshotText(image, (pct) => setStage(`Reading the text on your device… ${pct}%`));
    const combined = [note.trim() && `Note: ${note.trim()}`, text].filter(Boolean).join('\n');
    if (combined.replace(/\s/g, '').length < 20) throw new Error('Could not find enough text in that screenshot. Try one with more words or numbers.');
    setStage('Roasting what it says…');
    return api.roastText(combined, persona, heat);
  };

  const go = async () => {
    setLoading(true);
    setError('');
    try {
      if (!vision) return onRoast(await roastFromText());
      setStage('Reading every pixel…');
      try {
        onRoast(await api.roastImage(image, persona, heat, note));
      } catch (e) {
        if (e instanceof ApiError && e.fallback === 'ocr') onRoast(await roastFromText());
        else throw e;
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
      setStage('');
    }
  };

  return (
    <div className="space-y-8">
      {!vision && (
        <p className="rounded-2xl border border-flame/30 bg-flame/[0.06] p-4 text-sm text-flame">
          No AI vision on this server right now, so your device reads the text in the screenshot and the local roaster cooks it. Nothing is uploaded until the text is read.
        </p>
      )}
      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <div
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); load(e.dataTransfer.files[0]); }}
          onPaste={(e) => load(e.clipboardData.files[0])}
          className={`relative grid min-h-72 place-items-center overflow-hidden rounded-3xl border-2 border-dashed transition ${drag ? 'border-ember bg-ember/5' : 'border-white/12 bg-soot'}`}
        >
          {image ? (
            <>
              <img src={image} alt="Your screenshot" className="max-h-[28rem] w-full object-contain p-3" />
              <button onClick={() => setImage('')} aria-label="Remove image" className="absolute right-3 top-3 rounded-full bg-char/80 p-2 hover:bg-ash"><X className="size-4" /></button>
            </>
          ) : (
            <button onClick={() => input.current?.click()} className="flex flex-col items-center gap-3 p-10 text-center">
              <span className="bg-fire grid size-16 place-items-center rounded-2xl text-char"><ImageUp className="size-8" /></span>
              <span className="font-display text-xl font-bold">Drop, paste or pick a screenshot</span>
              <span className="max-w-sm text-sm text-dust">Instagram bio, Spotify Wrapped, LinkedIn headline, a dating profile, your Screen Time report. Anything with numbers and bad decisions.</span>
            </button>
          )}
          <input ref={input} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={(e) => load(e.target.files?.[0])} />
        </div>
        <label className="flex flex-col gap-2">
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-dust">Context (optional)</span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={500}
            placeholder="e.g. this is my Spotify Wrapped, I'm a senior engineer, be gentle (don't)"
            className="min-h-40 flex-1 resize-none rounded-3xl border border-white/10 bg-soot p-5 text-sm outline-none placeholder:text-dust/60 focus:border-ember/60"
          />
        </label>
      </div>

      {controls}

      <div className="flex flex-wrap items-center gap-4">
        <button
          onClick={go}
          disabled={!image || loading}
          className="bg-fire glow inline-flex h-14 items-center gap-2 rounded-full px-8 font-display text-lg font-bold text-char transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
        >
          {loading ? <Loader2 className="size-5 animate-spin" /> : <Flame className="size-5" />} {loading ? stage || 'Working…' : 'Roast this screenshot'}
        </button>
        {error && <p className="text-sm text-[#ff8a7a]" role="alert">{error}</p>}
      </div>
    </div>
  );
}
