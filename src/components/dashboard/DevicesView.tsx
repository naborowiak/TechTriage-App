import React, { useState, useEffect } from "react";
import {
  Wifi,
  Tv,
  Smartphone,
  Speaker,
  Thermometer,
  Printer,
  Monitor,
  Plus,
  ChevronDown,
  ChevronUp,
  MapPin,
  ArrowRight,
  X,
  Loader2,
  Trash2,
  Edit3,
} from "lucide-react";
import { LoadingScreen } from "../LoadingScreen";
import { formatCaseDisplayId } from "../../types";

interface Device {
  id: string;
  name: string;
  type: string;
  brand?: string | null;
  model?: string | null;
  location?: string | null;
  notes?: string | null;
  caseCount?: number;
  createdAt: string;
}

interface Case {
  id: string;
  title: string;
  status: string;
  sessionMode?: string | null;
  modeSequence?: number | null;
  createdAt: string;
  updatedAt?: string;
}

interface DevicesViewProps {
  onOpenCase: (caseId: string) => void;
  userId?: string;
}

const deviceTypeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  router: Wifi,
  smart_speaker: Speaker,
  thermostat: Thermometer,
  tv: Tv,
  computer: Monitor,
  printer: Printer,
  phone: Smartphone,
  tablet: Smartphone,
  smart_device: Speaker,
};

const deviceTypeLabels: Record<string, string> = {
  router: "Router",
  smart_speaker: "Smart Speaker",
  thermostat: "Thermostat",
  tv: "TV / Display",
  computer: "Computer",
  printer: "Printer",
  phone: "Phone",
  tablet: "Tablet",
  smart_device: "Smart Device",
};

const deviceTypes = Object.entries(deviceTypeLabels);

export const DevicesView: React.FC<DevicesViewProps> = ({
  onOpenCase,
  userId,
}) => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedDeviceId, setExpandedDeviceId] = useState<string | null>(null);
  const [deviceCases, setDeviceCases] = useState<Case[]>([]);
  const [loadingCases, setLoadingCases] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "router",
    brand: "",
    model: "",
    location: "",
  });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchDevices = () => {
    if (!userId) return;
    fetch("/api/devices", { credentials: "include" })
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error("Failed");
      })
      .then((data) => {
        if (Array.isArray(data)) setDevices(data);
      })
      .catch((err) => console.error("Failed to load devices:", err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchDevices();
  }, [userId]);

  // Fetch cases for expanded device
  useEffect(() => {
    if (!expandedDeviceId) {
      setDeviceCases([]);
      return;
    }
    setLoadingCases(true);
    fetch(`/api/cases?deviceId=${expandedDeviceId}`, { credentials: "include" })
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error("Failed");
      })
      .then((data) => {
        if (Array.isArray(data)) setDeviceCases(data);
      })
      .catch(() => setDeviceCases([]))
      .finally(() => setLoadingCases(false));
  }, [expandedDeviceId]);

  const handleToggleExpand = (deviceId: string) => {
    setExpandedDeviceId((prev) => (prev === deviceId ? null : deviceId));
  };

  const resetForm = () => {
    setFormData({ name: "", type: "router", brand: "", model: "", location: "" });
    setEditingDevice(null);
    setShowAddForm(false);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.type) return;
    setSaving(true);
    try {
      const url = editingDevice ? `/api/devices/${editingDevice.id}` : "/api/devices";
      const method = editingDevice ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: formData.name.trim(),
          type: formData.type,
          brand: formData.brand.trim() || null,
          model: formData.model.trim() || null,
          location: formData.location.trim() || null,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      resetForm();
      fetchDevices();
    } catch (err) {
      console.error("Failed to save device:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (deviceId: string) => {
    setDeletingId(deviceId);
    try {
      const res = await fetch(`/api/devices/${deviceId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed");
      setDevices((prev) => prev.filter((d) => d.id !== deviceId));
      if (expandedDeviceId === deviceId) setExpandedDeviceId(null);
    } catch (err) {
      console.error("Failed to delete device:", err);
    } finally {
      setDeletingId(null);
    }
  };

  const startEdit = (device: Device) => {
    setFormData({
      name: device.name,
      type: device.type,
      brand: device.brand || "",
      model: device.model || "",
      location: device.location || "",
    });
    setEditingDevice(device);
    setShowAddForm(true);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <LoadingScreen size="sm" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-text-primary dark:text-white">
            Devices
          </h1>
          <button
            onClick={() => {
              resetForm();
              setShowAddForm(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-electric-indigo hover:bg-electric-indigo/10 transition-colors min-h-[44px]"
            aria-label="Add device"
          >
            <Plus className="w-4 h-4" />
            Add Device
          </button>
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="card-clean rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text-primary dark:text-white">
                {editingDevice ? "Edit Device" : "Add Device"}
              </h3>
              <button
                onClick={resetForm}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-text-secondary hover:text-text-primary hover:bg-light-100 dark:hover:bg-midnight-700 transition-colors"
                aria-label="Cancel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Device name *"
                value={formData.name}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                className="px-3 py-2.5 rounded-lg border border-surface-border dark:border-midnight-700 bg-white dark:bg-midnight-800 text-sm text-text-primary dark:text-white placeholder:text-text-muted outline-none focus:border-electric-indigo focus:ring-2 focus:ring-electric-indigo/10 min-h-[44px]"
              />
              <select
                value={formData.type}
                onChange={(e) => setFormData((p) => ({ ...p, type: e.target.value }))}
                className="px-3 py-2.5 rounded-lg border border-surface-border dark:border-midnight-700 bg-white dark:bg-midnight-800 text-sm text-text-primary dark:text-white outline-none focus:border-electric-indigo focus:ring-2 focus:ring-electric-indigo/10 min-h-[44px]"
              >
                {deviceTypes.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Brand (optional)"
                value={formData.brand}
                onChange={(e) => setFormData((p) => ({ ...p, brand: e.target.value }))}
                className="px-3 py-2.5 rounded-lg border border-surface-border dark:border-midnight-700 bg-white dark:bg-midnight-800 text-sm text-text-primary dark:text-white placeholder:text-text-muted outline-none focus:border-electric-indigo focus:ring-2 focus:ring-electric-indigo/10 min-h-[44px]"
              />
              <input
                type="text"
                placeholder="Model (optional)"
                value={formData.model}
                onChange={(e) => setFormData((p) => ({ ...p, model: e.target.value }))}
                className="px-3 py-2.5 rounded-lg border border-surface-border dark:border-midnight-700 bg-white dark:bg-midnight-800 text-sm text-text-primary dark:text-white placeholder:text-text-muted outline-none focus:border-electric-indigo focus:ring-2 focus:ring-electric-indigo/10 min-h-[44px]"
              />
              <input
                type="text"
                placeholder="Location (e.g., Living Room)"
                value={formData.location}
                onChange={(e) => setFormData((p) => ({ ...p, location: e.target.value }))}
                className="px-3 py-2.5 rounded-lg border border-surface-border dark:border-midnight-700 bg-white dark:bg-midnight-800 text-sm text-text-primary dark:text-white placeholder:text-text-muted outline-none focus:border-electric-indigo focus:ring-2 focus:ring-electric-indigo/10 min-h-[44px] sm:col-span-2"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={resetForm}
                className="px-4 py-2 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-light-100 dark:hover:bg-midnight-700 transition-colors min-h-[44px]"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !formData.name.trim()}
                className="px-4 py-2 rounded-lg text-sm font-semibold btn-gradient-electric text-white disabled:opacity-50 min-h-[44px]"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingDevice ? "Save" : "Add Device"}
              </button>
            </div>
          </div>
        )}

        {/* Device List */}
        {devices.length === 0 ? (
          <div className="card-clean rounded-2xl p-8 text-center">
            <Smartphone className="w-10 h-10 text-text-muted mx-auto mb-3" />
            <p className="text-sm text-text-secondary dark:text-white/60 mb-4">
              No devices added yet. Add your home devices to track support cases per device.
            </p>
            <button
              onClick={() => {
                resetForm();
                setShowAddForm(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-electric-indigo hover:bg-electric-indigo/10 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add your first device
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {devices.map((device) => {
              const DeviceIcon = deviceTypeIcons[device.type] || Smartphone;
              const isExpanded = expandedDeviceId === device.id;

              return (
                <div key={device.id} className="card-clean rounded-2xl overflow-hidden">
                  <button
                    onClick={() => handleToggleExpand(device.id)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-left min-h-[56px] hover:bg-light-100/40 dark:hover:bg-white/[0.02] transition-all group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-electric-indigo/[0.08] flex items-center justify-center shrink-0">
                      <DeviceIcon className="w-5 h-5 text-electric-indigo" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-semibold text-text-primary dark:text-white block truncate">
                        {device.name}
                      </span>
                      <span className="text-xs text-text-secondary dark:text-white/50 flex items-center gap-2">
                        {device.brand && <span>{device.brand}{device.model ? ` ${device.model}` : ""}</span>}
                        {device.location && (
                          <span className="flex items-center gap-0.5">
                            <MapPin className="w-3 h-3" />
                            {device.location}
                          </span>
                        )}
                      </span>
                    </div>
                    {(device.caseCount || 0) > 0 && (
                      <span className="text-xs font-semibold text-electric-indigo bg-electric-indigo/10 px-2 py-0.5 rounded-full shrink-0">
                        {device.caseCount} {device.caseCount === 1 ? "case" : "cases"}
                      </span>
                    )}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startEdit(device);
                        }}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-text-secondary hover:text-text-primary hover:bg-light-200/80 dark:hover:bg-midnight-600/50 transition-all opacity-0 group-hover:opacity-100"
                        aria-label={`Edit ${device.name}`}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(device.id);
                        }}
                        disabled={deletingId === device.id}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-text-secondary hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                        aria-label={`Delete ${device.name}`}
                      >
                        {deletingId === device.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-text-secondary shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-text-secondary shrink-0" />
                    )}
                  </button>

                  {/* Expanded: related cases */}
                  {isExpanded && (
                    <div className="border-t border-light-200/80 dark:border-white/[0.04]">
                      {loadingCases ? (
                        <div className="flex items-center justify-center p-4">
                          <Loader2 className="w-5 h-5 animate-spin text-electric-indigo" />
                        </div>
                      ) : deviceCases.length === 0 ? (
                        <div className="px-4 py-4 text-center">
                          <p className="text-xs text-text-secondary dark:text-white/50">
                            No support cases linked to this device
                          </p>
                        </div>
                      ) : (
                        <div className="divide-y divide-light-200/60 dark:divide-white/[0.03]">
                          {deviceCases.map((c) => {
                            const displayId = formatCaseDisplayId(c.sessionMode, c.modeSequence);
                            return (
                              <button
                                key={c.id}
                                onClick={() => onOpenCase(c.id)}
                                className="w-full flex items-center gap-3 px-4 pl-14 py-3 text-left hover:bg-light-100/40 dark:hover:bg-white/[0.02] transition-all min-h-[44px] group/case"
                              >
                                <span className="text-xs font-mono text-text-secondary dark:text-white/50">
                                  {displayId}
                                </span>
                                <span className="text-sm text-text-primary dark:text-white truncate flex-1 group-hover/case:text-electric-indigo transition-colors">
                                  {c.title}
                                </span>
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                  c.status === "resolved"
                                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                    : c.status === "escalated"
                                      ? "bg-orange-400/15 text-orange-600 dark:text-orange-400"
                                      : "bg-blue-400/15 text-blue-600 dark:text-blue-400"
                                }`}>
                                  {c.status}
                                </span>
                                <ArrowRight className="w-3.5 h-3.5 text-text-secondary/40 shrink-0 opacity-0 group-hover/case:opacity-100 transition-all" />
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
