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
  { key: 'context', label: 'Context (optional)', required: false }
];

export default function PhysioForm({ onSuccess }: PhysioFormProps) {
  const [step, setStep] = useState<number>(0);
  const [energy, setEnergy] = useState<number | null>(null);
  const [mood, setMood] = useState<number | null>(null);
  const [focusClarity, setFocusClarity] = useState<number | null>(null);
  const [stress, setStress] = useState<number | null>(null);
  const [context, setContext] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [needsAuth, setNeedsAuth] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const loadExistingLog = async () => {
      try {
        const { data: sessionRes } = await supabase.auth.getSession();
        if (!sessionRes.session) {
          setNeedsAuth(true);
          setIsLoading(false);
          return;
        }
        const today = new Date().toISOString().slice(0, 10);
        const existingLog = await getPhysioLogForDate(supabase, today);
        
        if (existingLog) {
          setEnergy(existingLog.energy);
          setMood(existingLog.mood);
          setFocusClarity(existingLog.focus_clarity);
          setStress(existingLog.stress);
          setContext(existingLog.context || '');
        }
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
      const today = new Date().toISOString().slice(0, 10);
      const payload: PhysioLogInput = {
        date: today,
        energy,
        mood,
        focus_clarity: focusClarity,
        stress,
        context: context.trim() || undefined,
      };

      const supabase = createSupabaseBrowserClient();
      await upsertPhysioLog(supabase, payload);
      
      onSuccess?.();
    } catch (err) {
      console.error('Error saving physio log:', err);
      setError('Failed to save your physio log. Please try again.');
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
          <label className="block text-sm font-medium text-gray-700">
            {currentStep.label}
          </label>
          <input
            type="text"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="e.g., tired, gym, travel"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            maxLength={50}
          />
          <p className="text-xs text-gray-500">1-2 words to describe your day</p>
        </div>
      );
    }

    const currentValue = currentStep.key === 'energy' ? energy :
                        currentStep.key === 'mood' ? mood :
                        currentStep.key === 'focusClarity' ? focusClarity :
                        stress;

    return (
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">
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
                  : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
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
        <div className="text-center text-gray-500">Loading...</div>
      </div>
    );
  }

  if (needsAuth) {
    return (
      <div className="space-y-4">
        <div className="text-center space-y-2">
          <h2 className="text-lg font-semibold">Sign in to save your physio</h2>
          <p className="text-sm text-gray-600">Use your email and password.</p>
        </div>
        <SignInInline />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-sm text-gray-500">Step {step + 1} of {STEPS.length}</p>
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
