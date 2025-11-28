'use client';

import { useState, useEffect } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabaseClient';
import { getPhysioLogForDate, upsertPhysioLog, PhysioLogInput } from '@/lib/db/physio';
import SignInInline from '@/components/auth/SignInInline';
import { Button } from '@/components/ui/Button';

interface PhysioFormProps {
  onSuccess?: () => void;
}

const STEPS = [
  { key: 'energy', label: 'Energy (0–10)', required: true },
  { key: 'mood', label: 'Mood (0–10)', required: true },
  { key: 'focusClarity', label: 'Focus Clarity (0–10)', required: true },
  { key: 'stress', label: 'Stress (0–10)', required: true },
  { key: 'context', label: 'Context (optional)', required: false },
  { key: 'vitals', label: 'Daily Vitals (optional)', required: false },
];

export default function PhysioForm({ onSuccess }: PhysioFormProps) {
  const [step, setStep] = useState<number>(0);
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
  const [bedTime, setBedTime] = useState<string>('');
  const [wakeTime, setWakeTime] = useState<string>('');
  const [dayTags, setDayTags] = useState<string[]>([]);
  const [dayNotes, setDayNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [needsAuth, setNeedsAuth] = useState(false);
  const supabase = createSupabaseBrowserClient();

  const AVAILABLE_DAY_TAGS = [
    'partner_sleepover',
    'travel_day',
    'sick',
    'hangover',
    'big_shooting_day',
    'heavy_conflict',
    'social_overload',
    'social_recharge',
  ] as const;

  function humanizeTag(tag: string): string {
    return tag
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  useEffect(() => {
    const loadExistingLog = async () => {
      try {
        const { data: sessionRes } = await supabase.auth.getSession();
        if (!sessionRes.session) {
          setNeedsAuth(true);
          setIsLoading(false);
          return;
        }
        const today = new Date().toISOString().slice(0, 10);
        // Do not prefill from existing log; start fresh each time
        await getPhysioLogForDate(supabase, today);
      } catch (err) {
        console.error('Error loading existing physio log:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadExistingLog();
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setNeedsAuth(false);
        loadExistingLog();
      }
    });
    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleValueSelect = (value: number) => {
    const currentStepKey = STEPS[step].key;
    switch (currentStepKey) {
      case 'energy':
        setEnergy(value);
        break;
      case 'mood':
        setMood(value);
        break;
      case 'focusClarity':
        setFocusClarity(value);
        break;
      case 'stress':
        setStress(value);
        break;
    }
  };

  const handleSubmit = async () => {
    if (energy === null || mood === null || focusClarity === null || stress === null) {
      setError('Please complete all required fields');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const now = new Date();
      const today = now.toISOString().slice(0, 10);
      let caffeineLastIso: string | undefined;
      if (caffeineLastTime) {
        const [hours, minutes] = caffeineLastTime.split(':').map(Number);
        const dt = new Date(now);
        dt.setHours(hours ?? 0, minutes ?? 0, 0, 0);
        caffeineLastIso = dt.toISOString();
      }
      const { data: userRes } = await supabase.auth.getUser();
      if (!userRes.user) {
        setError('Please sign in to save your physio log.');
        setLoading(false);
        return;
      }
      const payload: PhysioLogInput = {
        date: today,
        energy,
        mood,
        focus_clarity: focusClarity,
        stress,
        context: context.trim() || undefined,
        user_id: userRes.user.id,
        sleep_hours: sleepHours ?? undefined,
        sleep_quality: sleepQuality ?? undefined,
        resting_hr: restingHr ?? undefined,
        hrv_score: hrvScore ?? undefined,
        caffeine_total_mg: caffeineTotal ?? undefined,
        caffeine_last_intake_time: caffeineLastIso,
        bed_time: bedTime || undefined,
        wake_time: wakeTime || undefined,
        day_tags: dayTags.length > 0 ? dayTags : undefined,
        day_notes: dayNotes.trim() || undefined,
      };

      await upsertPhysioLog(supabase, payload);

      onSuccess?.();
    } catch (err: any) {
      console.error('Error saving physio log:', err);
      setError(err?.message ? String(err.message) : 'Failed to save your physio log. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isNextDisabled = () => {
    const currentStep = STEPS[step];
    if (!currentStep.required) return false;
    
    switch (currentStep.key) {
      case 'energy':
        return energy === null;
      case 'mood':
        return mood === null;
      case 'focusClarity':
        return focusClarity === null;
      case 'stress':
        return stress === null;
      default:
        return false;
    }
  };

  const renderStepContent = () => {
    const currentStep = STEPS[step];
    
    if (currentStep.key === 'context') {
      return (
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
            {currentStep.label}
          </label>
          <input
            type="text"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="e.g., tired, gym, travel"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-black dark:text-white dark:border-gray-600 dark:placeholder-gray-400"
            maxLength={50}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">1-2 words to describe your day</p>
        </div>
      );
    }

    if (currentStep.key === 'vitals') {
      return (
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">Optional: log your sleep and caffeine for today.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Sleep Hours</label>
              <input type="number" step="0.1" value={sleepHours ?? ''} onChange={(e) => setSleepHours(e.target.value ? parseFloat(e.target.value) : null)} className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-black dark:text-white dark:border-gray-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Sleep Quality (0–10)</label>
              <input type="number" min={0} max={10} value={sleepQuality ?? ''} onChange={(e) => setSleepQuality(e.target.value ? parseInt(e.target.value, 10) : null)} className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-black dark:text-white dark:border-gray-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Resting HR (bpm)</label>
              <input type="number" value={restingHr ?? ''} onChange={(e) => setRestingHr(e.target.value ? parseInt(e.target.value, 10) : null)} className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-black dark:text-white dark:border-gray-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">HRV Score (0–100)</label>
              <input type="number" min={0} max={100} value={hrvScore ?? ''} onChange={(e) => setHrvScore(e.target.value ? parseInt(e.target.value, 10) : null)} className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-black dark:text-white dark:border-gray-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Caffeine Total (mg)</label>
              <input type="number" step={1} value={caffeineTotal ?? ''} onChange={(e) => setCaffeineTotal(e.target.value ? parseInt(e.target.value, 10) : null)} className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-black dark:text-white dark:border-gray-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Last Caffeine Time</label>
              <input type="time" value={caffeineLastTime} onChange={(e) => setCaffeineLastTime(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-black dark:text-white dark:border-gray-600" />
            </div>
          </div>
          <section className="mt-6">
            <h3 className="text-sm font-medium mb-2 dark:text-gray-200">Day context (optional)</h3>
            <p className="text-xs text-gray-600 dark:text-gray-300 mb-2">
              Tag anything unusual about today so it can be considered in your insights later.
            </p>
            <div className="flex flex-wrap gap-2 mb-3">
              {AVAILABLE_DAY_TAGS.map((tag) => {
                const selected = dayTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      setDayTags((prev) =>
                        prev.includes(tag)
                          ? prev.filter((t) => t !== tag)
                          : [...prev, tag]
                      );
                    }}
                    className={`px-3 py-1 rounded-full text-xs border ${
                      selected
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-transparent text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-700'
                    }`}
                  >
                    {humanizeTag(tag)}
                  </button>
                );
              })}
            </div>
            <label className="block text-xs font-medium mb-1 dark:text-gray-200">Day notes (optional)</label>
            <textarea
              className="w-full rounded-md border bg-white px-3 py-2 text-sm dark:bg-black dark:text-gray-200 dark:border-gray-700"
              rows={2}
              value={dayNotes}
              onChange={(e) => setDayNotes(e.target.value)}
              placeholder="Anything special about today? (e.g. argument, amazing win, weird schedule)"
            />
          </section>
        </div>
      );
    }

    const currentValue = currentStep.key === 'energy' ? energy :
                        currentStep.key === 'mood' ? mood :
                        currentStep.key === 'focusClarity' ? focusClarity :
                        stress;

    return (
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
          {currentStep.label}
        </label>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 11 }).map((_, value) => (
            <button
              key={value}
              type="button"
              onClick={() => handleValueSelect(value)}
              className={`w-12 h-12 rounded-md border-2 font-medium transition-colors ${
                currentValue === value
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400 dark:bg-zinc-900 dark:text-gray-200 dark:border-gray-700 dark:hover:border-gray-600'
              }`}
            >
              {value}
            </button>
          ))}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="text-center text-gray-500 dark:text-gray-300">Loading...</div>
      </div>
    );
  }

  if (needsAuth) {
    return (
      <div className="space-y-4">
        <div className="text-center space-y-2">
          <h2 className="text-lg font-semibold">Sign in to save your physio</h2>
        <p className="text-sm text-gray-600 dark:text-gray-300">Use your email and password.</p>
        </div>
        <SignInInline />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-sm text-gray-500 dark:text-gray-300">Step {step + 1} of {STEPS.length}</p>
      </div>
      
      {renderStepContent()}
      
      {error && (
        <p className="text-sm text-red-600 text-center">{error}</p>
      )}
      
      <div className="flex gap-2">
        {step > 0 && (
          <Button
            onClick={handleBack}
            variant="secondary"
            className="flex-1"
          >
            Back
          </Button>
        )}
        
        {step < STEPS.length - 1 ? (
          <Button
            onClick={handleNext}
            disabled={isNextDisabled()}
            className="flex-1"
          >
            Next
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            variant="primary"
            className="flex-1 bg-green-600 hover:bg-green-700 focus:ring-green-600"
          >
            {isSubmitting ? 'Saving...' : 'Save Physio'}
          </Button>
        )}
      </div>
    </div>
  );
}
