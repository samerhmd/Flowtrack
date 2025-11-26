import type { Session } from '@/lib/db/sessions';

interface SessionCardProps {
  session: Session;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString(undefined, { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

function formatDurationMinutes(durationSeconds: number): string {
  const minutes = Math.round(durationSeconds / 60);
  return `${minutes} min`;
}

export default function SessionCard({ session }: SessionCardProps) {
  return (
    <div className="border rounded-lg p-3 bg-white flex justify-between items-center dark:bg-black dark:border-gray-700">
      <div>
        <div className="text-sm text-gray-500 dark:text-gray-300">{formatDate(session.date)}</div>
        <div className="text-base font-medium dark:text-gray-200">
          {session.activity || '(no title)'}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-300">
          {formatDurationMinutes(session.duration_seconds)} · Flow: {session.flow_rating}
        </div>
      </div>
    </div>
  );
}
