import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { toast } from 'react-toastify';
import { formatDate } from '../utils/helpers';

const AdminPanel = () => {
  const [drops, setDrops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingDrop, setEditingDrop] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image_url: '',
    total_stock: '',
    claim_window_start: '',
    claim_window_end: ''
  });

  useEffect(() => {
    fetchDrops();
  }, []);

  const fetchDrops = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAllDrops();
      setDrops(response.data.data.drops);
    } catch (error) {
      toast.error('Failed to load drops');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (drop = null) => {
    if (drop) {
      setEditingDrop(drop);
      setFormData({
        title: drop.title,
        description: drop.description || '',
        image_url: drop.image_url || '',
        total_stock: drop.total_stock,
        claim_window_start: new Date(drop.claim_window_start).toISOString().slice(0, 16),
        claim_window_end: new Date(drop.claim_window_end).toISOString().slice(0, 16)
      });
    } else {
      setEditingDrop(null);
      setFormData({
        title: '',
        description: '',
        image_url: '',
        total_stock: '',
        claim_window_start: '',
        claim_window_end: ''
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingDrop(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const data = {
        ...formData,
        total_stock: parseInt(formData.total_stock),
        claim_window_start: new Date(formData.claim_window_start).toISOString(),
        claim_window_end: new Date(formData.claim_window_end).toISOString()
      };

      if (editingDrop) {
        await adminAPI.updateDrop(editingDrop.id, data);
        toast.success('Drop updated successfully');
      } else {
        await adminAPI.createDrop(data);
        toast.success('Drop created successfully');
      }
      
      handleCloseModal();
      fetchDrops();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this drop?')) {
      return;
    }

    try {
      await adminAPI.deleteDrop(id);
      toast.success('Drop deleted successfully');
      fetchDrops();
    } catch (error) {
      toast.error('Failed to delete drop');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          <button
            onClick={() => handleOpenModal()}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            + Create New Drop
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Waitlist</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Claimed</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Claim Window</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {drops.map((drop) => (
                  <tr key={drop.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{drop.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-gray-900">{drop.available_stock} / {drop.total_stock}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-purple-600 font-semibold">{drop.waitlist_count || 0}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-green-600 font-semibold">{drop.claimed_count || 0}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div>{formatDate(drop.claim_window_start)}</div>
                      <div>{formatDate(drop.claim_window_end)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleOpenModal(drop)}
                        className="text-purple-600 hover:text-purple-900 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(drop.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
              <h2 className="text-2xl font-bold mb-6">
                {editingDrop ? 'Edit Drop' : 'Create New Drop'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Image URL</label>
                  <input
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Total Stock</label>
                  <input
                    type="number"
                    value={formData.total_stock}
                    onChange={(e) => setFormData({ ...formData, total_stock: e.target.value })}
                    required
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Claim Window Start</label>
                  <input
                    type="datetime-local"
                    value={formData.claim_window_start}
                    onChange={(e) => setFormData({ ...formData, claim_window_start: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Claim Window End</label>
                  <input
                    type="datetime-local"
                    value={formData.claim_window_end}
                    onChange={(e) => setFormData({ ...formData, claim_window_end: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    {editingDrop ? 'Update' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;