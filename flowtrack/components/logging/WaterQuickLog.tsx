"use client";
import { useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabaseClient';
import { createWaterEvent, WaterEventInput } from '@/lib/db/water';

export interface WaterQuickLogProps {
  onLogged?: () => void;
  defaultMl?: number;
}

export default function WaterQuickLog({ onLogged, defaultMl }: WaterQuickLogProps) {
  const [ml, setMl] = useState<number | null>(defaultMl ?? null);
  const [customMode, setCustomMode] = useState(false);
  const [customMl, setCustomMl] = useState<string>('');
  const [source, setSource] = useState<string>('glass');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const presets = [250, 500, 750, 1000];
  const sources = ['glass', 'bottle', 'other'];

  const submit = async () => {
    setError(null);
    const chosenMl = customMode ? parseFloat(customMl) : ml ?? null;
    if (!chosenMl || Number.isNaN(chosenMl) || chosenMl <= 0) {
      setError('Enter a valid ml');
      return;
    }
    setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const input: WaterEventInput = {
        ml: Math.round(chosenMl),
        source,
      };
      await createWaterEvent(supabase, input);
      setLoading(false);
      if (!customMode) setMl(null);
      if (onLogged) onLogged();
    } catch (e: any) {
      setLoading(false);
      setError(e?.message || 'Failed to log');
    }
  };

  return (
    <div className="border rounded-lg p-3 bg-white shadow-sm dark:bg-black dark:border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold dark:text-gray-200">Water</h3>
      </div>
      <div className="flex flex-wrap gap-2 mb-3">
        {presets.map(p => (
          <button
            key={p}
            type="button"
            onClick={() => { setCustomMode(false); setMl(p); }}
            className={`px-3 py-1 text-sm rounded border ${ml === p && !customMode ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-100 dark:bg-gray-900 dark:text-gray-200 dark:border-gray-700'}`}
          >
            {p} ml
          </button>
        ))}
        <button
          type="button"
          onClick={() => { setCustomMode(true); setMl(null); }}
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
            value={customMl}
            onChange={e => setCustomMl(e.target.value)}
            placeholder="ml"
            className="w-24 px-2 py-1 text-sm rounded border bg-white dark:bg-black dark:text-gray-200 dark:border-gray-700"
          />
          <span className="text-xs dark:text-gray-300">ml</span>
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
        {loading ? 'Logging…' : 'Log water'}
      </button>
    </div>
  );
}

