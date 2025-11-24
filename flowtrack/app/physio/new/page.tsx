'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PhysioForm from '@/components/physio/PhysioForm';
import { Button } from '@/components/ui/Button';

export default function NewPhysioPage() {
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();

  const handleSuccess = () => {
    setIsSuccess(true);
  };

  const handleBackToDashboard = () => {
    router.push('/dashboard');
  };

  if (isSuccess) {
    return (
      <div className="space-y-4 max-w-md mx-auto mt-8">
        <div className="text-center space-y-2">
          <h1 className="text-xl font-semibold text-green-600">Success!</h1>
          <p className="text-sm text-gray-600">
            Your daily physio log has been saved.
          </p>
        </div>
        <Button 
          onClick={handleBackToDashboard}
          className="w-full"
        >
          Back to dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-md mx-auto mt-8">
      <h1 className="text-xl font-semibold">Daily Physio</h1>
      <p className="text-sm text-gray-600">
        Log how your body and mind feel today.
      </p>
      <PhysioForm onSuccess={handleSuccess} />
    </div>
  );
}