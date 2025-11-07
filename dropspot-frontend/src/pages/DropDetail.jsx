import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { dropsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatDate, getDropStatus, getStatusColor, canClaim } from '../utils/helpers';
import { toast } from 'react-toastify';

const DropDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [drop, setDrop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchDrop();
  }, [id]);

  const fetchDrop = async () => {
    try {
      setLoading(true);
      const response = await dropsAPI.getById(id);
      setDrop(response.data.data.drop);
    } catch (error) {
      console.error('Failed to fetch drop:', error);
      toast.error('Failed to load drop details');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinWaitlist = async () => {
    if (!isAuthenticated) {
      toast.info('Please login to join waitlist');
      navigate('/login');
      return;
    }

    try {
      setActionLoading(true);
      const startTime = Date.now();
      
      const response = await dropsAPI.joinWaitlist(id, Date.now() - startTime);
      
      toast.success(response.data.message);
      fetchDrop();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to join waitlist');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeaveWaitlist = async () => {
    try {
      setActionLoading(true);
      const response = await dropsAPI.leaveWaitlist(id);
      toast.success(response.data.message);
      fetchDrop();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to leave waitlist');
    } finally {
      setActionLoading(false);
    }
  };

  const handleClaim = async () => {
    if (!isAuthenticated) {
      toast.info('Please login to claim');
      navigate('/login');
      return;
    }

    try {
      setActionLoading(true);
      const response = await dropsAPI.claim(id);
      
      if (response.data.success) {
        toast.success(`Successfully claimed! Your code: ${response.data.data.claim.claim_code}`);
        fetchDrop();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to claim drop');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!drop) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-900">Drop not found</h2>
        </div>
      </div>
    );
  }

  const status = getDropStatus(drop.claim_window_start, drop.claim_window_end);
  const statusColor = getStatusColor(status);
  const isClaimable = canClaim(drop.claim_window_start, drop.claim_window_end);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <button
          onClick={() => navigate('/')}
          className="mb-6 text-purple-600 hover:text-purple-700 font-medium"
        >
          ← Back to Drops
        </button>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="md:flex">
            {/* Image */}
            <div className="md:w-1/2">
              <img
                src={drop.image_url || 'https://via.placeholder.com/600x400?text=No+Image'}
                alt={drop.title}
                className="w-full h-96 object-cover"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/600x400?text=No+Image';
                }}
              />
            </div>

            {/* Content */}
            <div className="md:w-1/2 p-8">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-3xl font-bold text-gray-900">{drop.title}</h1>
                <span className={`px-4 py-2 rounded-full text-sm font-semibold border ${statusColor}`}>
                  {status.toUpperCase()}
                </span>
              </div>

              <p className="text-gray-600 mb-6">{drop.description}</p>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">Available</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {drop.available_stock}
                  </div>
                  <div className="text-xs text-gray-500">/ {drop.total_stock}</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-sm text-purple-600 mb-1">Waitlist</div>
                  <div className="text-2xl font-bold text-purple-700">
                    {drop.waitlist_count || 0}
                  </div>
                  <div className="text-xs text-purple-600">people</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-sm text-green-600 mb-1">Claimed</div>
                  <div className="text-2xl font-bold text-green-700">
                    {drop.claimed_count || 0}
                  </div>
                  <div className="text-xs text-green-600">times</div>
                </div>
              </div>

              {/* Claim Window Info */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Claim Window</h3>
                <div className="text-sm text-gray-700">
                  <div>Starts: {formatDate(drop.claim_window_start)}</div>
                  <div>Ends: {formatDate(drop.claim_window_end)}</div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                {drop.user_claimed && (
                  <div className="p-4 bg-green-100 border border-green-300 rounded-lg">
                    <p className="text-green-800 font-semibold">
                      ✓ You have already claimed this drop!
                    </p>
                  </div>
                )}

                {!drop.user_claimed && drop.user_in_waitlist && !isClaimable && (
                  <div className="space-y-3">
                    <div className="p-4 bg-purple-100 border border-purple-300 rounded-lg">
                      <p className="text-purple-800 font-semibold">
                        ✓ You're in the waitlist!
                      </p>
                    </div>
                    <button
                      onClick={handleLeaveWaitlist}
                      disabled={actionLoading}
                      className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition disabled:opacity-50"
                    >
                      {actionLoading ? 'Processing...' : 'Leave Waitlist'}
                    </button>
                  </div>
                )}

                {!drop.user_claimed && drop.user_in_waitlist && isClaimable && (
                  <button
                    onClick={handleClaim}
                    disabled={actionLoading || drop.available_stock === 0}
                    className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                  >
                    {actionLoading ? 'Processing...' : drop.available_stock === 0 ? 'Out of Stock' : 'Claim Now!'}
                  </button>
                )}

                {!drop.user_claimed && !drop.user_in_waitlist && (
                  <button
                    onClick={handleJoinWaitlist}
                    disabled={actionLoading}
                    className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 font-semibold"
                  >
                    {actionLoading ? 'Processing...' : 'Join Waitlist'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DropDetail;