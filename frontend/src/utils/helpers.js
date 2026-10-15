export const formatPrice = (price) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price);
};


export const formatDuration = (minutes) => {
  const totalSeconds = Math.round(Number(minutes || 0) * 60);

  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) {
    return '0 min';
  }

  if (totalSeconds < 60) {
    return `${totalSeconds} sec`;
  }

  const hours = Math.floor(totalSeconds / 3600);
  const remainingMinutes = Math.floor(
    (totalSeconds % 3600) / 60
  );
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    if (remainingMinutes > 0) {
      return `${hours} hr ${remainingMinutes} min`;
    }

    return `${hours} hr`;
  }

  if (seconds > 0) {
    return `${remainingMinutes} min ${seconds} sec`;
  }

  return `${remainingMinutes} min`;
};


export const getImageUrl = (path) => {
  if (!path) return 'https://placehold.co/600x400/indigo/white?text=Course';
  if (path.startsWith('http')) return path;
  const base = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5001';
  return `${base}${path}`;
};

export const getLevelColor = (level) => {
  const colors = {
    beginner: 'bg-green-100 text-green-800',
    intermediate: 'bg-yellow-100 text-yellow-800',
    advanced: 'bg-red-100 text-red-800',
  };
  return colors[level] || 'bg-gray-100 text-gray-800';
};
