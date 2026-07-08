import Button from './Button';

/**
 * EmptyState — shown when a list or section has no content.
 *
 * @param {React.ReactNode} icon - Lucide icon element
 * @param {string} title - Primary heading
 * @param {string} description - Supporting text
 * @param {string} actionLabel - Optional button text
 * @param {() => void} onAction - Optional button click handler
 * @param {string} className
 */
const EmptyState = ({
  icon,
  title = 'Nothing here yet',
  description = '',
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center py-16 px-6 ${className}`}
    >
      {/* Icon wrapper */}
      {icon && (
        <div className="mb-5 p-5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
          <span className="block w-10 h-10">{icon}</span>
        </div>
      )}

      <h3 className="text-lg font-semibold text-white mb-2 font-['Outfit']">{title}</h3>

      {description && (
        <p className="text-slate-400 text-sm max-w-sm leading-relaxed mb-6">{description}</p>
      )}

      {actionLabel && onAction && (
        <Button variant="primary" size="md" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
