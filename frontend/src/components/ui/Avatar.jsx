// src/components/ui/Avatar.jsx
const GRADIENTS = [
  'from-violet-500 to-purple-600',
  'from-cyan-500 to-blue-600',
  'from-emerald-500 to-teal-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600',
  'from-indigo-500 to-violet-600',
];

function getGradient(name) {
  const safeName = String(name || '');
  const charCode = safeName.charCodeAt(0) || 0;
  const idx = charCode % GRADIENTS.length;
  return GRADIENTS[idx];
}

const SIZES = {
  xs:  'w-6 h-6 text-[10px]',
  sm:  'w-8 h-8 text-xs',
  md:  'w-10 h-10 text-sm',
  lg:  'w-12 h-12 text-base',
  xl:  'w-16 h-16 text-xl',
  '2xl': 'w-24 h-24 text-3xl',
  '3xl': 'w-32 h-32 text-4xl',
};

const optimizeCloudinaryUrl = (url) => {
  if (!url || typeof url !== 'string') return url;
  if (url.includes('res.cloudinary.com') && !url.includes('f_auto')) {
    const parts = url.split('/upload/');
    if (parts.length === 2) {
      return `${parts[0]}/upload/f_auto,q_auto/${parts[1]}`;
    }
  }
  return url;
};

export default function Avatar({ src, name, size = 'md', online, className = '', onClick }) {
  const sizeClass = SIZES[size] || SIZES.md;
  const safeName = String(name || '');
  const initials  = safeName ? safeName.charAt(0).toUpperCase() : '?';
  const gradient  = getGradient(safeName);

  return (
    <div
      className={`relative inline-flex flex-shrink-0 ${sizeClass} ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {src ? (
        <img
          src={optimizeCloudinaryUrl(src)}
          alt={name}
          className="w-full h-full rounded-full object-cover border border-slate-200"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
      ) : (
        <div
          className={`w-full h-full rounded-full bg-gradient-to-br ${gradient}
            flex items-center justify-center font-bold text-white select-none`}
        >
          {initials}
        </div>
      )}
      {online && (
        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
      )}
    </div>
  );
}
