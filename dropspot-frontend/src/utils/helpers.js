import { format, formatDistanceToNow, isPast, isFuture, isWithinInterval } from 'date-fns';

export const formatDate = (date) => {
  return format(new Date(date), 'PPpp');
};

export const formatRelativeTime = (date) => {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

export const getDropStatus = (claimWindowStart, claimWindowEnd) => {
  const now = new Date();
  const start = new Date(claimWindowStart);
  const end = new Date(claimWindowEnd);

  if (isPast(end)) {
    return 'ended';
  } else if (isWithinInterval(now, { start, end })) {
    return 'active';
  } else if (isFuture(start)) {
    return 'upcoming';
  }
  return 'unknown';
};

export const canClaim = (claimWindowStart, claimWindowEnd) => {
  const now = new Date();
  const start = new Date(claimWindowStart);
  const end = new Date(claimWindowEnd);
  
  return isWithinInterval(now, { start, end });
};

export const getStatusColor = (status) => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'upcoming':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'ended':
      return 'bg-gray-100 text-gray-800 border-gray-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

export const truncateText = (text, maxLength = 100) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};