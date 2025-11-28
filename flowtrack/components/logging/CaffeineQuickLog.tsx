"use client";
import { useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabaseClient';
import { createCaffeineEvent, CaffeineEventInput } from '@/lib/db/caffeine';

export interface CaffeineQuickLogProps {
  onLogged?: () => void;
  defaultSource?: string;
}

export default function CaffeineQuickLog({ onLogged, defaultSource }: CaffeineQuickLogProps) {
  const [mg, setMg] = useState<number | null>(null);
  const [customMode, setCustomMode] = useState(false);
  const [customMg, setCustomMg] = useState<string>('');
  const [source, setSource] = useState<string>(defaultSource || 'pill');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const presets = [50, 100, 200];
  const sources = ['pill', 'coffee', 'energy_drink', 'other'];

  const submit = async () => {
    setError(null);
    const chosenMg = customMode ? parseFloat(customMg) : mg ?? null;
    if (!chosenMg || Number.isNaN(chosenMg) || chosenMg <= 0) {
      setError('Enter a valid mg');
      return;
    }
    setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const input: CaffeineEventInput = {
        mg: Math.round(chosenMg),
        source,
      };
      await createCaffeineEvent(supabase, input);
      setLoading(false);
      if (!customMode) setMg(null);
      if (onLogged) onLogged();
    } catch (e: any) {
      setLoading(false);
      setError(e?.message || 'Failed to log');
    }
  };

  return (
    <div className="border rounded-lg p-3 bg-white shadow-sm dark:bg-black dark:border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold dark:text-gray-200">Caffeine</h3>
      </div>
      <div className="flex flex-wrap gap-2 mb-3">
        {presets.map(p => (
          <button
            key={p}
            type="button"
            onClick={() => { setCustomMode(false); setMg(p); }}
            className={`px-3 py-1 text-sm rounded border ${mg === p && !customMode ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-100 dark:bg-gray-900 dark:text-gray-200 dark:border-gray-700'}`}
          >
            {p} mg
          </button>
        ))}
        <button
          type="button"
          onClick={() => { setCustomMode(true); setMg(null); }}
          className={`px-3 py-1 text-sm rounded border ${customMode ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-100 dark:bg-gray-900 dark:text-gray-200 dark:border-gray-700'}`}
        >
          Custom
        </button>
      </div>
      {customMode && (
        <div className="flex items-center gap-2 mb-3">
          <input
            type="number"
            min={1}
            value={customMg}
            onChange={e => setCustomMg(e.target.value)}
            placeholder="mg"
            className="w-24 px-2 py-1 text-sm rounded border bg-white dark:bg-black dark:text-gray-200 dark:border-gray-700"
          />
          <span className="text-xs dark:text-gray-300">mg</span>
        </div>
      )}
      <div className="flex flex-wrap gap-2 mb-3">
        {sources.map(s => (
          <button
            key={s}
            type="button"
            onClick={() => setSource(s)}
            className={`px-3 py-1 text-sm rounded border ${source === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-100 dark:bg-gray-900 dark:text-gray-200 dark:border-gray-700'}`}
          >
            {s}
          </button>
        ))}
      </div>
      {error && <div className="text-xs text-red-600 dark:text-red-400 mb-2">{error}</div>}
      <button
        type="button"
        disabled={loading}
        onClick={submit}
        className="px-3 py-1 text-sm rounded bg-blue-600 text-white disabled:opacity-60"
      >
        {loading ? 'Logging…' : 'Log caffeine'}
      </button>
    </div>
  );
}

