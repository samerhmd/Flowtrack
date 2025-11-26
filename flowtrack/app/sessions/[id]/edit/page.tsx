'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabaseClient';
import { getSessionById, updateSession, SessionUpdateInput } from '@/lib/db/sessions';
import { Button } from '@/components/ui/Button';

export default function EditSessionPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const supabase = createSupabaseBrowserClient();

  const [activity, setActivity] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [flowRating, setFlowRating] = useState<number | null>(null);
  const [environment, setEnvironment] = useState<string>('');
  const [noise, setNoise] = useState<string>('');
  const [sessionType, setSessionType] = useState<string>('');
  const [distractionLevel, setDistractionLevel] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const s = await getSessionById(supabase, id);
      if (s) {
        setActivity(s.activity || '');
        setNotes(s.notes || '');
        setFlowRating(s.flow_rating ?? null);
        setEnvironment(s.environment || '');
        setNoise(s.noise || '');
        setSessionType(s.session_type || '');
        setDistractionLevel(s.distraction_level ?? null);
      }
      setLoading(false);
    };
    load();
  }, [id]);

  const save = async () => {
    try {
      setError(null);
      const updates: SessionUpdateInput = {
        activity: activity.trim() || undefined,
        notes: notes.trim() || undefined,
        flow_rating: flowRating ?? undefined,
        environment: environment || undefined,
        noise: noise || undefined,
        session_type: sessionType || undefined,
        distraction_level: distractionLevel ?? undefined,
      };
      await updateSession(supabase, id, updates);
      router.push('/sessions');
    } catch (e: any) {
      setError(e?.message || 'Save failed');
    }
  };

  if (loading) return <div className="max-w-md mx-auto mt-8 text-sm text-gray-600 dark:text-gray-300">Loading…</div>;

  return (
    <div className="space-y-4 max-w-md mx-auto mt-8">
      <h1 className="text-xl font-semibold dark:text-gray-200">Edit Session</h1>
      <div className="space-y-2">
        <label className="block text-sm dark:text-gray-200">Activity</label>
        <input type="text" value={activity} onChange={(e) => setActivity(e.target.value)} className="w-full px-3 py-2 border rounded-md dark:bg-black dark:text-white" />
      </div>
      <div className="space-y-2">
        <label className="block text-sm dark:text-gray-200">Notes</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full px-3 py-2 border rounded-md dark:bg-black dark:text-white" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm dark:text-gray-200">Flow Rating (0–10)</label>
          <input type="number" min={0} max={10} value={flowRating ?? ''} onChange={(e) => setFlowRating(e.target.value ? parseInt(e.target.value, 10) : null)} className="w-full px-3 py-2 border rounded-md dark:bg-black dark:text-white" />
        </div>
        <div>
          <label className="block text-sm dark:text-gray-200">Environment</label>
          <select value={environment} onChange={(e) => setEnvironment(e.target.value)} className="w-full px-3 py-2 border rounded-md dark:bg-black dark:text-white">
            <option value="">Select</option>
            <option value="home">Home</option>
            <option value="office">Office</option>
            <option value="cafe">Cafe</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-sm dark:text-gray-200">Noise</label>
          <select value={noise} onChange={(e) => setNoise(e.target.value)} className="w-full px-3 py-2 border rounded-md dark:bg-black dark:text-white">
            <option value="">Select</option>
            <option value="quiet">Quiet</option>
            <option value="music">Music</option>
            <option value="white_noise">White Noise</option>
            <option value="unknown">Unknown</option>
          </select>
        </div>
        <div>
          <label className="block text-sm dark:text-gray-200">Session Type</label>
          <select value={sessionType} onChange={(e) => setSessionType(e.target.value)} className="w-full px-3 py-2 border rounded-md dark:bg-black dark:text-white">
            <option value="">Select</option>
            <option value="deep_work">Deep Work</option>
            <option value="shallow">Shallow</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div>
          <label className="block text-sm dark:text-gray-200">Distraction Level (0–10)</label>
          <input type="number" min={0} max={10} value={distractionLevel ?? ''} onChange={(e) => setDistractionLevel(e.target.value ? parseInt(e.target.value, 10) : null)} className="w-full px-3 py-2 border rounded-md dark:bg-black dark:text-white" />
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <Button onClick={save} className="flex-1">Save</Button>
        <Button variant="secondary" onClick={() => router.push('/sessions')} className="flex-1">Cancel</Button>
      </div>
    </div>
  );
}
