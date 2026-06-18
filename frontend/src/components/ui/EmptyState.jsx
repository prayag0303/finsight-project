export default function EmptyState({ icon, title, description, action, actionLabel }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-5xl mb-4 opacity-50">{icon || '📭'}</div>
      <h3 className="text-sm font-semibold text-gray-700 mb-2">{title}</h3>
      {description && <p className="text-sm text-gray-400 max-w-xs">{description}</p>}
      {action && (
        <button onClick={action} className="btn-primary mt-6">
          {actionLabel || 'Get started'}
        </button>
      )}
    </div>
  );
}
