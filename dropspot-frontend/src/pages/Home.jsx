import React, { useState, useEffect } from 'react';
import { dropsAPI } from '../services/api';
import DropCard from '../components/DropCard';
import { toast } from 'react-toastify';

const Home = () => {
  const [drops, setDrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, upcoming, active, ended

  useEffect(() => {
    fetchDrops();
  }, []);

  const fetchDrops = async () => {
    try {
      setLoading(true);
      const response = await dropsAPI.getAll();
      setDrops(response.data.data.drops);
    } catch (error) {
      console.error('Failed to fetch drops:', error);
      toast.error('Failed to load drops');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredDrops = () => {
    if (filter === 'all') return drops;
    return drops.filter(drop => drop.status === filter);
  };

  const filteredDrops = getFilteredDrops();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Explore Exclusive Drops
          </h1>
          <p className="text-gray-600">
            Join waitlists for limited stock items and claim them when your turn comes
          </p>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-8">
          {['all', 'upcoming', 'active', 'ended'].map((filterOption) => (
            <button
              key={filterOption}
              onClick={() => setFilter(filterOption)}
              className={`px-6 py-2 rounded-lg font-medium transition ${
                filter === filterOption
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        )}

        {/* Drops Grid */}
        {!loading && filteredDrops.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDrops.map((drop) => (
              <DropCard key={drop.id} drop={drop} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredDrops.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No drops found</h3>
            <p className="text-gray-600">
              {filter === 'all'
                ? 'No drops available at the moment'
                : `No ${filter} drops available`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;