import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ 
  text = 'Loading...', 
  size = 'md',
  fullPage = false 
}) {
  const sizeMap = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const containerClass = fullPage
    ? 'fixed inset-0 flex items-center justify-center bg-white'
    : 'flex justify-center items-center py-12';

  return (
    <div className={containerClass}>
      <div className="flex flex-col items-center gap-3">
        <Loader2 className={`${sizeMap[size]} text-teal-600 animate-spin`} />
        {text && <p className="text-sm text-slate-500">{text}</p>}
      </div>
    </div>
  );
}
