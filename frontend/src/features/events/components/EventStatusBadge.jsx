const STATUS_CONFIG = {
  draft: { label: 'Draft', className: 'bg-slate-100 text-slate-700' },
  pending: { label: 'Pending Approval', className: 'bg-amber-100 text-amber-700' },
  approved: { label: 'Live', className: 'bg-teal-100 text-teal-700' },
  rejected: { label: 'Rejected', className: 'bg-red-100 text-red-700' },
  cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-700' },
  completed: { label: 'Completed', className: 'bg-blue-100 text-blue-700' },
  archived: { label: 'Archived', className: 'bg-slate-100 text-slate-700' },
};

export default function EventStatusBadge({ status, className = '' }) {
  const config = STATUS_CONFIG[status] || { label: status, className: 'bg-slate-100 text-slate-700' };

  return (
    <span
      className={`px-2.5 py-1 text-xs font-bold rounded-full uppercase tracking-wide ${config.className} ${className}`}
    >
      {config.label}
    </span>
  );
}
