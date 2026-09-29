const Alert = ({ type = 'info', message, onClose }) => {
  const styles = {
    info: 'bg-blue-50 text-blue-800 border-blue-200',
    success: 'bg-green-50 text-green-800 border-green-200',
    error: 'bg-red-50 text-red-800 border-red-200',
    warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
  };

  if (!message) return null;

  return (
    <div className={`mb-4 rounded-lg border px-4 py-3 text-sm ${styles[type]}`}>
      <div className="flex items-start justify-between gap-2">
        <span>{message}</span>
        {onClose && (
          <button onClick={onClose} className="font-bold hover:opacity-70" aria-label="Close">
            ×
          </button>
        )}
      </div>
    </div>
  );
};

export default Alert;
