'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabaseClient';
import { upsertPhysioLog, PhysioLogInput, PhysioLog } from '@/lib/db/physio';
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
  const [sleepHours, setSleepHours] = useState<number | null>(null);
  const [sleepQuality, setSleepQuality] = useState<number | null>(null);
  const [restingHr, setRestingHr] = useState<number | null>(null);
  const [hrvScore, setHrvScore] = useState<number | null>(null);
  const [caffeineTotal, setCaffeineTotal] = useState<number | null>(null);
  const [caffeineLastTime, setCaffeineLastTime] = useState<string>('');
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
        setSleepHours(data.sleep_hours ?? null);
        setSleepQuality(data.sleep_quality ?? null);
        setRestingHr(data.resting_hr ?? null);
        setHrvScore(data.hrv_score ?? null);
        setCaffeineTotal(data.caffeine_total_mg ?? null);
        if (data.caffeine_last_intake_time) {
          const dt = new Date(data.caffeine_last_intake_time);
          const hh = String(dt.getHours()).padStart(2, '0');
          const mm = String(dt.getMinutes()).padStart(2, '0');
          setCaffeineLastTime(`${hh}:${mm}`);
        }
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
      const now = new Date();
      const { data: userRes } = await supabase.auth.getUser();
      if (!userRes.user) {
        setError('Please sign in to save your physio log.');
        return;
      }
      const payload: PhysioLogInput = {
        date,
        energy: energy!,
        mood: mood!,
        focus_clarity: focusClarity!,
        stress: stress!,
        context: context.trim() || undefined,
        user_id: userRes.user.id,
        sleep_hours: sleepHours ?? undefined,
        sleep_quality: sleepQuality ?? undefined,
        resting_hr: restingHr ?? undefined,
        hrv_score: hrvScore ?? undefined,
        caffeine_total_mg: caffeineTotal ?? undefined,
        caffeine_last_intake_time: caffeineLastTime
          ? (() => {
              const [hh, mm] = caffeineLastTime.split(':').map(Number);
              const dt = new Date(now);
              dt.setHours(hh ?? 0, mm ?? 0, 0, 0);
              return dt.toISOString();
            })()
          : undefined,
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm dark:text-gray-200">Sleep Hours</label>
          <input type="number" step={0.1} value={sleepHours ?? ''} onChange={(e) => setSleepHours(e.target.value ? parseFloat(e.target.value) : null)} className="w-full px-3 py-2 border rounded-md dark:bg-black dark:text-white" />
        </div>
        <div>
          <label className="block text-sm dark:text-gray-200">Sleep Quality (0–10)</label>
          <input type="number" min={0} max={10} value={sleepQuality ?? ''} onChange={(e) => setSleepQuality(e.target.value ? parseInt(e.target.value, 10) : null)} className="w-full px-3 py-2 border rounded-md dark:bg-black dark:text-white" />
        </div>
        <div>
          <label className="block text-sm dark:text-gray-200">Resting HR (bpm)</label>
          <input type="number" value={restingHr ?? ''} onChange={(e) => setRestingHr(e.target.value ? parseInt(e.target.value, 10) : null)} className="w-full px-3 py-2 border rounded-md dark:bg-black dark:text-white" />
        </div>
        <div>
          <label className="block text-sm dark:text-gray-200">HRV Score (0–100)</label>
          <input type="number" min={0} max={100} value={hrvScore ?? ''} onChange={(e) => setHrvScore(e.target.value ? parseInt(e.target.value, 10) : null)} className="w-full px-3 py-2 border rounded-md dark:bg-black dark:text-white" />
        </div>
        <div>
          <label className="block text-sm dark:text-gray-200">Caffeine Total (mg)</label>
          <input type="number" step={1} value={caffeineTotal ?? ''} onChange={(e) => setCaffeineTotal(e.target.value ? parseInt(e.target.value, 10) : null)} className="w-full px-3 py-2 border rounded-md dark:bg-black dark:text-white" />
        </div>
        <div>
          <label className="block text-sm dark:text-gray-200">Last Caffeine Time</label>
          <input type="time" value={caffeineLastTime} onChange={(e) => setCaffeineLastTime(e.target.value)} className="w-full px-3 py-2 border rounded-md dark:bg-black dark:text-white" />
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <Button onClick={save} className="flex-1">Save</Button>
        <Button variant="secondary" onClick={() => router.push('/physio/history')} className="flex-1">Cancel</Button>
      </div>
    </div>
  );
}
