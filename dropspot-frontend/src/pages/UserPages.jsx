import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dropsAPI } from '../services/api';
import { formatDate } from '../utils/helpers';
import { toast } from 'react-toastify';

export const MyWaitlist = () => {
  const [waitlist, setWaitlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchWaitlist();
  }, []);

  const fetchWaitlist = async () => {
    try {
      const response = await dropsAPI.getUserWaitlist();
      setWaitlist(response.data.data.waitlist);
    } catch (error) {
      toast.error('Failed to load waitlist');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Waitlist</h1>

        {waitlist.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No items in waitlist</h3>
            <p className="text-gray-600 mb-6">Join a drop waitlist to see it here</p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Browse Drops
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {waitlist.map((item) => (
              <div
                key={item.id}
                onClick={() => navigate(`/drops/${item.drop_id}`)}
                className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition cursor-pointer"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Priority Score: <span className="font-semibold">{item.priority_score}</span></p>
                      <p>Joined: {formatDate(item.joined_at)}</p>
                      <p>Claim Window: {formatDate(item.claim_window_start)}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    item.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {item.status.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export const MyClaims = () => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchClaims();
  }, []);

  const fetchClaims = async () => {
    try {
      const response = await dropsAPI.getUserClaims();
      setClaims(response.data.data.claims);
    } catch (error) {
      toast.error('Failed to load claims');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success('Claim code copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Claims</h1>

        {claims.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🎟️</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No claims yet</h3>
            <p className="text-gray-600 mb-6">Claim a drop to see your codes here</p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Browse Drops
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            {claims.map((claim) => (
              <div key={claim.id} className="bg-white p-6 rounded-lg shadow-lg">
                <div className="flex items-start gap-6">
                  {claim.image_url && (
                    <img
                      src={claim.image_url}
                      alt={claim.title}
                      className="w-32 h-32 object-cover rounded-lg"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{claim.title}</h3>
                    <p className="text-gray-600 mb-4">{claim.description}</p>
                    <div className="flex items-center gap-4">
                      <div className="flex-1 p-4 bg-green-50 border-2 border-green-300 rounded-lg">
                        <div className="text-sm text-green-700 mb-1">Your Claim Code</div>
                        <div className="text-2xl font-bold text-green-900 font-mono">
                          {claim.claim_code}
                        </div>
                      </div>
                      <button
                        onClick={() => handleCopyCode(claim.claim_code)}
                        className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                      >
                        Copy Code
                      </button>
                    </div>
                    <div className="mt-3 text-sm text-gray-500">
                      Claimed: {formatDate(claim.claimed_at)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};