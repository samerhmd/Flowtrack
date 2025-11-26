'use client';

import { useState, useEffect } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabaseClient';
import { createSession, SessionCreateInput } from '@/lib/db/sessions';
import SessionTimer from './SessionTimer';
import { Button } from '@/components/ui/Button';
import SignInInline from '@/components/auth/SignInInline';

interface SessionWizardProps {
  onSuccess?: () => void;
}

type Phase = 'pre' | 'in' | 'post';

export default function SessionWizard({ onSuccess }: SessionWizardProps) {
  const [phase, setPhase] = useState<Phase>('pre');
  const [activity, setActivity] = useState<string>('');
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [flowRating, setFlowRating] = useState<number | null>(null);
  const [notes, setNotes] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      setNeedsAuth(!data.session);
    };
    init();
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setNeedsAuth(!session);
    });
    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  const handleStartSession = () => {
    setStartTime(new Date());
    setPhase('in');
  };

  const handleEndSession = () => {
    setEndTime(new Date());
    setPhase('post');
  };

  const handleSaveSession = async () => {
    if (!startTime || !endTime || flowRating === null) {
      setError('Please complete all required fields');
      return;
    }

    if (flowRating < 0 || flowRating > 10) {
      setError('Flow rating must be between 0 and 10');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const startIso = startTime.toISOString();
      const endIso = endTime.toISOString();
      const durationSeconds = Math.max(
        Math.round((endTime.getTime() - startTime.getTime()) / 1000),
        1
      );
      const date = startIso.slice(0, 10);

      const payload: SessionCreateInput = {
        date,
        start_time: startIso,
        end_time: endIso,
        duration_seconds: durationSeconds,
        activity: activity.trim() || undefined,
        flow_rating: flowRating,
        notes: notes.trim() || undefined,
      };

      const supabase = createSupabaseBrowserClient();
      const { data: sessionRes } = await supabase.auth.getSession();
      const token = sessionRes.session?.access_token;

      const resp = await fetch('/api/sessions/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        throw new Error(body?.message || 'Failed to save');
      }
      
      onSuccess?.();
    } catch (err) {
      console.error('Error saving session:', err);
      setError('Failed to save your session. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderPrePhase = () => (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Ready to start?</h2>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Activity (optional)
        </label>
        <input
          type="text"
          value={activity}
          onChange={(e) => setActivity(e.target.value)}
          placeholder="What will you work on?"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          maxLength={100}
        />
      </div>
      <Button
        onClick={handleStartSession}
        className="w-full"
      >
        Start Session
      </Button>
    </div>
  );

  const renderInPhase = () => (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <h2 className="text-lg font-semibold">Session Running</h2>
        <p className="text-sm text-gray-600">
          Started at {startTime?.toLocaleTimeString()}
        </p>
        {startTime && <SessionTimer startTime={startTime} />}
      </div>
      <Button
        onClick={handleEndSession}
        className="w-full bg-red-600 hover:bg-red-700 focus:ring-red-600"
      >
        End Session
      </Button>
    </div>
  );

  const renderPostPhase = () => {
    const durationMinutes = endTime && startTime 
      ? Math.round((endTime.getTime() - startTime.getTime()) / 1000 / 60)
      : 0;

    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Session Complete</h2>
        <div className="bg-gray-50 p-3 rounded-md">
          <p className="text-sm text-gray-600">Duration: {durationMinutes} minutes</p>
          {activity && <p className="text-sm text-gray-600">Activity: {activity}</p>}
        </div>
        
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Flow Rating (0–10) *
          </label>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 11 }).map((_, value) => (
              <button
                key={value}
                type="button"
                onClick={() => setFlowRating(value)}
                className={`w-10 h-10 rounded-md border-2 font-medium transition-colors ${
                  flowRating === value
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="How did the session go?"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            maxLength={500}
          />
        </div>

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <Button
          onClick={handleSaveSession}
          disabled={isSaving || flowRating === null}
          className="w-full bg-green-600 hover:bg-green-700 focus:ring-green-600"
        >
          {isSaving ? 'Saving...' : 'Save Session'}
        </Button>
      </div>
    );
  };

  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm">
      {needsAuth && (
        <div className="space-y-4 mb-4">
          <div className="text-center space-y-2">
            <h2 className="text-lg font-semibold">Sign in to save your session</h2>
            <p className="text-sm text-gray-600">Use your email and password.</p>
          </div>
          <SignInInline />
        </div>
      )}
      {phase === 'pre' && renderPrePhase()}
      {phase === 'in' && renderInPhase()}
      {phase === 'post' && renderPostPhase()}
    </div>
  );
}
