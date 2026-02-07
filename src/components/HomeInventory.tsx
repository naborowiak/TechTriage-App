import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Wifi, Speaker, Thermometer, Monitor, Laptop, Printer, Gamepad2, Lock, Camera as CameraIcon, Package, X } from 'lucide-react';
import { DeviceRecord } from '../types';

interface HomeInventoryProps {
  embedded?: boolean;
}

const DEVICE_TYPES = [
  { value: 'router', label: 'Router/Modem', icon: Wifi },
  { value: 'smart_speaker', label: 'Smart Speaker', icon: Speaker },
  { value: 'thermostat', label: 'Thermostat', icon: Thermometer },
  { value: 'tv', label: 'TV/Display', icon: Monitor },
  { value: 'computer', label: 'Computer/Laptop', icon: Laptop },
  { value: 'printer', label: 'Printer', icon: Printer },
  { value: 'game_console', label: 'Game Console', icon: Gamepad2 },
  { value: 'smart_lock', label: 'Smart Lock', icon: Lock },
  { value: 'camera', label: 'Camera', icon: CameraIcon },
  { value: 'appliance', label: 'Appliance', icon: Package },
  { value: 'other', label: 'Other', icon: Package },
];

const getDeviceIcon = (type: string) => {
  const dt = DEVICE_TYPES.find(d => d.value === type);
  if (dt) {
    const Icon = dt.icon;
    return <Icon className="w-6 h-6" />;
  }
  return <Package className="w-6 h-6" />;
};

const getDeviceLabel = (type: string) => {
  return DEVICE_TYPES.find(d => d.value === type)?.label || type;
};

interface DeviceFormData {
  name: string;
  type: string;
  brand: string;
  model: string;
  location: string;
  notes: string;
}

const emptyForm: DeviceFormData = {
  name: '',
  type: 'router',
  brand: '',
  model: '',
  location: '',
  notes: '',
};

export const HomeInventory: React.FC<HomeInventoryProps> = ({ embedded = false }) => {
  const [devices, setDevices] = useState<DeviceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDevice, setEditingDevice] = useState<DeviceRecord | null>(null);
  const [form, setForm] = useState<DeviceFormData>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/devices', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setDevices(data);
      }
    } catch (e) {
      console.error('Failed to fetch devices:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingDevice(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const handleEdit = (device: DeviceRecord) => {
    setEditingDevice(device);
    setForm({
      name: device.name,
      type: device.type,
      brand: device.brand || '',
      model: device.model || '',
      location: device.location || '',
      notes: device.notes || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/devices/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        setDevices(prev => prev.filter(d => d.id !== id));
      }
    } catch (e) {
      console.error('Failed to delete device:', e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.type) return;

    setIsSaving(true);
    try {
      if (editingDevice) {
        // Update
        const res = await fetch(`/api/devices/${editingDevice.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(form),
        });
        if (res.ok) {
          const updated = await res.json();
          setDevices(prev => prev.map(d => d.id === editingDevice.id ? updated : d));
        }
      } else {
        // Create
        const res = await fetch('/api/devices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(form),
        });
        if (res.ok) {
          const newDevice = await res.json();
          setDevices(prev => [newDevice, ...prev]);
        }
      }
      setShowModal(false);
    } catch (e) {
      console.error('Failed to save device:', e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={embedded ? 'max-w-6xl mx-auto' : ''}>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary dark:text-white">Home Inventory</h1>
          <p className="text-sm text-text-muted">Manage your devices for faster, personalized support</p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-electric-indigo to-electric-cyan text-white font-semibold text-sm shadow-lg hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          Add Device
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-3 border-electric-indigo border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-muted">Loading devices...</p>
        </div>
      ) : devices.length === 0 ? (
        <div className="bg-white dark:bg-midnight-800 rounded-2xl p-12 text-center border border-gray-100 dark:border-midnight-700">
          <Package className="w-16 h-16 text-gray-200 dark:text-midnight-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-text-primary dark:text-white mb-2">No Devices Yet</h3>
          <p className="text-text-muted mb-6">
            Add your home devices so Scout can provide personalized troubleshooting.
          </p>
          <button
            onClick={handleAdd}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-electric-indigo to-electric-cyan text-white font-semibold text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Your First Device
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {devices.map(device => (
            <div
              key={device.id}
              className="bg-white dark:bg-midnight-800 rounded-2xl p-5 border border-gray-100 dark:border-midnight-700 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-xl bg-electric-indigo/10 dark:bg-electric-indigo/20 flex items-center justify-center text-electric-indigo">
                  {getDeviceIcon(device.type)}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(device)}
                    className="p-1.5 rounded-lg text-text-muted hover:bg-gray-100 dark:hover:bg-midnight-700 hover:text-electric-indigo transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(device.id)}
                    className="p-1.5 rounded-lg text-text-muted hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <h3 className="font-bold text-text-primary dark:text-white mb-1">{device.name}</h3>
              <p className="text-xs text-text-muted mb-2">{getDeviceLabel(device.type)}</p>
              {(device.brand || device.model) && (
                <p className="text-sm text-text-secondary">
                  {[device.brand, device.model].filter(Boolean).join(' ')}
                </p>
              )}
              {device.location && (
                <p className="text-xs text-text-muted mt-1">{device.location}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Device Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-midnight-800 rounded-2xl p-6 max-w-lg w-full border border-gray-100 dark:border-midnight-700 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-text-primary dark:text-white">
                {editingDevice ? 'Edit Device' : 'Add Device'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-lg text-text-muted hover:bg-gray-100 dark:hover:bg-midnight-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary dark:text-white mb-1">Device Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Living Room Router"
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-midnight-600 bg-white dark:bg-midnight-900 text-text-primary dark:text-white placeholder:text-text-muted focus:border-electric-indigo focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary dark:text-white mb-1">Device Type *</label>
                <select
                  required
                  value={form.type}
                  onChange={e => setForm(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-midnight-600 bg-white dark:bg-midnight-900 text-text-primary dark:text-white focus:border-electric-indigo focus:outline-none transition-colors"
                >
                  {DEVICE_TYPES.map(dt => (
                    <option key={dt.value} value={dt.value}>{dt.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary dark:text-white mb-1">Brand</label>
                  <input
                    type="text"
                    value={form.brand}
                    onChange={e => setForm(prev => ({ ...prev, brand: e.target.value }))}
                    placeholder="e.g., Netgear"
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-midnight-600 bg-white dark:bg-midnight-900 text-text-primary dark:text-white placeholder:text-text-muted focus:border-electric-indigo focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary dark:text-white mb-1">Model</label>
                  <input
                    type="text"
                    value={form.model}
                    onChange={e => setForm(prev => ({ ...prev, model: e.target.value }))}
                    placeholder="e.g., Nighthawk R7000"
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-midnight-600 bg-white dark:bg-midnight-900 text-text-primary dark:text-white placeholder:text-text-muted focus:border-electric-indigo focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary dark:text-white mb-1">Location</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={e => setForm(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="e.g., Office, Living Room, Kitchen"
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-midnight-600 bg-white dark:bg-midnight-900 text-text-primary dark:text-white placeholder:text-text-muted focus:border-electric-indigo focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary dark:text-white mb-1">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Any additional notes about this device..."
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-midnight-600 bg-white dark:bg-midnight-900 text-text-primary dark:text-white placeholder:text-text-muted focus:border-electric-indigo focus:outline-none transition-colors resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-midnight-600 text-text-primary dark:text-white font-semibold hover:bg-gray-50 dark:hover:bg-midnight-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !form.name.trim()}
                  className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-electric-indigo to-electric-cyan text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : editingDevice ? 'Update Device' : 'Add Device'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
