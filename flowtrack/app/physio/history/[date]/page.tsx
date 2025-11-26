'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabaseClient';
import { upsertPhysioLog, PhysioLogInput } from '@/lib/db/physio';
import { Button } from '@/components/ui/Button';

export default function EditPhysioDayPage() {
  const params = useParams();
  const router = useRouter();
  const date = params?.date as string;
  const supabase = createSupabaseBrowserClient();

  const [energy, setEnergy] = useState<number | null>(null);
  const [mood, setMood] = useState<number | null>(null);
  const [focusClarity, setFocusClarity] = useState<number | null>(null);
  const [stress, setStress] = useState<number | null>(null);
  const [context, setContext] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('physio_logs')
        .select('*')
        .eq('date', date)
        .maybeSingle();
      if (data) {
        setEnergy(data.energy);
        setMood(data.mood);
        setFocusClarity(data.focus_clarity);
        setStress(data.stress);
        setContext(data.context || '');
      }
      setLoading(false);
    };
    load();
  }, [date]);

  const save = async () => {
    try {
      setError(null);
      if ([energy, mood, focusClarity, stress].some(v => v == null)) {
        setError('Complete required fields');
        return;
      }
      const payload: PhysioLogInput = {
        date,
        energy: energy!,
        mood: mood!,
        focus_clarity: focusClarity!,
        stress: stress!,
        context: context.trim() || undefined,
      };
      await upsertPhysioLog(supabase, payload);
      router.push('/physio/history');
    } catch (e: any) {
      setError(e?.message || 'Save failed');
    }
  };

  if (loading) return <div className="max-w-md mx-auto mt-8 text-sm text-gray-600 dark:text-gray-300">Loading…</div>;

  return (
    <div className="space-y-4 max-w-md mx-auto mt-8">
      <h1 className="text-xl font-semibold dark:text-gray-200">Edit Physio – {date}</h1>
      <div className="space-y-2">
        <label className="block text-sm dark:text-gray-200">Energy (0–10)</label>
        <input type="number" min={0} max={10} value={energy ?? ''} onChange={(e) => setEnergy(e.target.value ? parseInt(e.target.value, 10) : null)} className="w-full px-3 py-2 border rounded-md dark:bg-black dark:text-white" />
      </div>
      <div className="space-y-2">
        <label className="block text-sm dark:text-gray-200">Mood (0–10)</label>
        <input type="number" min={0} max={10} value={mood ?? ''} onChange={(e) => setMood(e.target.value ? parseInt(e.target.value, 10) : null)} className="w-full px-3 py-2 border rounded-md dark:bg-black dark:text-white" />
      </div>
      <div className="space-y-2">
        <label className="block text-sm dark:text-gray-200">Focus Clarity (0–10)</label>
        <input type="number" min={0} max={10} value={focusClarity ?? ''} onChange={(e) => setFocusClarity(e.target.value ? parseInt(e.target.value, 10) : null)} className="w-full px-3 py-2 border rounded-md dark:bg:black dark:text:white" />
      </div>
      <div className="space-y-2">
        <label className="block text-sm dark:text-gray-200">Stress (0–10)</label>
        <input type="number" min={0} max={10} value={stress ?? ''} onChange={(e) => setStress(e.target.value ? parseInt(e.target.value, 10) : null)} className="w-full px-3 py-2 border rounded-md dark:bg-black dark:text-white" />
      </div>
      <div className="space-y-2">
        <label className="block text-sm dark:text-gray-200">Context</label>
        <input type="text" value={context} onChange={(e) => setContext(e.target.value)} className="w-full px-3 py-2 border rounded-md dark:bg-black dark:text-white" />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <Button onClick={save} className="flex-1">Save</Button>
        <Button variant="secondary" onClick={() => router.push('/physio/history')} className="flex-1">Cancel</Button>
      </div>
    </div>
  );
}
