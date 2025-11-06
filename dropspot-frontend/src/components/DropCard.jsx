import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDate, getDropStatus, getStatusColor, truncateText } from '../utils/helpers';

const DropCard = ({ drop }) => {
  const navigate = useNavigate();
  const status = getDropStatus(drop.claim_window_start, drop.claim_window_end);
  const statusColor = getStatusColor(status);

  const handleClick = () => {
    navigate(`/drops/${drop.id}`);
  };

  return (
    <div
      onClick={handleClick}
      className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 cursor-pointer overflow-hidden"
    >
      {/* Image */}
      <div className="relative h-48 bg-gray-200">
        {drop.image_url ? (
          <img
            src={drop.image_url}
            alt={drop.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/400x300?text=No+Image';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            No Image
          </div>
        )}
        
        {/* Status Badge */}
        <div className="absolute top-3 right-3">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusColor}`}>
            {status.toUpperCase()}
          </span>
        </div>

        {/* User Status Badges */}
        <div className="absolute bottom-3 left-3 flex gap-2">
          {drop.user_in_waitlist && (
            <span className="px-2 py-1 bg-purple-500 text-white rounded text-xs font-semibold">
              In Waitlist
            </span>
          )}
          {drop.user_claimed && (
            <span className="px-2 py-1 bg-green-500 text-white rounded text-xs font-semibold">
              Claimed ✓
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-xl font-bold text-gray-900 mb-2">{drop.title}</h3>
        
        <p className="text-gray-600 text-sm mb-4">
          {truncateText(drop.description, 100)}
        </p>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="text-center p-2 bg-gray-50 rounded">
            <div className="text-sm text-gray-500">Available</div>
            <div className="text-lg font-bold text-gray-900">
              {drop.available_stock}/{drop.total_stock}
            </div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded">
            <div className="text-sm text-gray-500">Waitlist</div>
            <div className="text-lg font-bold text-purple-600">
              {drop.waitlist_count || 0}
            </div>
          </div>
        </div>

        {/* Claim Window */}
        <div className="text-xs text-gray-500">
          <div>Starts: {formatDate(drop.claim_window_start)}</div>
          <div>Ends: {formatDate(drop.claim_window_end)}</div>
        </div>
      </div>
    </div>
  );
};

export default DropCard;