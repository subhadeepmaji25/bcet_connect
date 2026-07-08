/**
 * Badge component
 *
 * @param {'primary'|'success'|'warning'|'danger'|'info'|'neutral'} variant
 * @param {string} className - Additional classes
 */
const Badge = ({ children, variant = 'neutral', className = '', ...props }) => {
  const variants = {
    primary: 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30',
    success: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    warning: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    danger:  'bg-red-500/15 text-red-400 border border-red-500/30',
    info:    'bg-sky-500/15 text-sky-400 border border-sky-500/30',
    neutral: 'bg-white/10 text-slate-300 border border-white/15',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide ${variants[variant] || variants.neutral} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};

export default Badge;
