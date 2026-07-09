import Button from './Button';

/**
 * EmptyState — shown when a list or section has no content.
 * Supports multiple prop variations used across the codebase.
 */
const EmptyState = ({
  icon,
  title = 'Nothing here yet',
  description = '',
  message = '', // Alias for description
  actionLabel,
  actionText,   // Alias for actionLabel
  action,       // Alias object for { label, onClick }
  onAction,
  className = '',
}) => {
  const finalDescription = description || message;
  const finalActionLabel = actionLabel || actionText || action?.label;
  const finalOnAction = onAction || action?.onClick;

  return (
    <div
      className={`flex flex-col items-center justify-center text-center py-16 px-6 ${className}`}
    >
      {/* Icon wrapper */}
      {icon && (
        <div className="mb-5 p-5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
          <span className="block w-10 h-10">
            {typeof icon === 'function' || (typeof icon === 'object' && !icon.props) ? (() => {
              const IconComp = icon;
              return <IconComp className="w-full h-full" />;
            })() : icon}
          </span>
        </div>
      )}

      <h3 className="text-lg font-semibold text-slate-800 mb-2 font-['Outfit']">{title}</h3>

      {finalDescription && (
        <p className="text-slate-400 text-sm max-w-sm leading-relaxed mb-6">{finalDescription}</p>
      )}

      {finalActionLabel && finalOnAction && (
        <Button variant="primary" size="md" onClick={finalOnAction}>
          {finalActionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
