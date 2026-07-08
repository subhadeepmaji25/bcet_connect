/**
 * Skeleton loader component — renders a shimmer placeholder.
 *
 * @param {string} className - Tailwind size/shape classes (e.g. "h-4 w-32 rounded")
 */
const Skeleton = ({ className = '' }) => {
  return (
    <div
      className={`skeleton bg-white/8 rounded-lg relative overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <div
        className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite]"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 50%, transparent 100%)',
        }}
      />
      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default Skeleton;
