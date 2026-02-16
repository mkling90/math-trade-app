'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { updateProfileName } from '@/lib/supabaseData';

interface UserSettingsModalProps {
  userId: string;
  currentName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UserSettingsModal({ userId, currentName, onClose, onSuccess }: UserSettingsModalProps) {
  const [newName, setNewName] = useState(currentName);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!newName.trim()) {
      alert('Name cannot be empty');
      return;
    }

    setLoading(true);
    try {
      await updateProfileName(userId, newName.trim());
      alert('Name updated successfully! Refresh the page to see changes.');
      onSuccess();
      onClose();
    } catch (error: any) {
      alert('Error updating name: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">Edit Display Name</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Display Name
            </label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-400"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
