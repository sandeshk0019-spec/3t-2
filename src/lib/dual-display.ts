/**
 * 3T Dairy — Dual Display & Bluetooth Hardware Synchronization Library
 * Handles 0ms real-time multi-window sync & Web Bluetooth API connectivity.
 */

export interface DualDisplayState {
  branchId: string;
  branchName: string;
  status: 'standby' | 'weighing' | 'recorded' | 'payout_sent';
  farmer: {
    id: string;
    name: string;
    village: string;
    phone: string;
    animals: number;
    monthlyEarnings?: number;
    avatar?: string;
  } | null;
  measurement: {
    weight: number;
    fat: number;
    snf: number;
    shift: 'Morning' | 'Evening';
    ratePerLiter: number;
    totalAmount: number;
    isSimulated?: boolean;
    scaleConnected?: boolean;
    scaleName?: string;
  };
  baseRates: {
    basePrice: number;
    fatFactor: number;
    snfFactor: number;
  };
  timestamp: number;
}

const STORAGE_KEY = '3t_dual_display_state';
const CHANNEL_NAME = '3t_dual_display_sync';

let lastNetworkBroadcastTime = 0;
let networkBroadcastTimer: any = null;

/**
 * Broadcast current terminal weighing state to all customer displays (Local & Network)
 */
export function broadcastDualDisplayState(state: DualDisplayState): void {
  if (typeof window === 'undefined') return;

  // 1. BroadcastChannel (0ms multi-tab/window on same device)
  try {
    if ('BroadcastChannel' in window) {
      const channel = new BroadcastChannel(CHANNEL_NAME);
      channel.postMessage(state);
      channel.close();
    }
  } catch {}

  // 2. LocalStorage event fallback (same device)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}

  // 3. Cross-Device Network Cloud Relay (For Phone, Tablet, Smart TV across Wi-Fi/Internet)
  const now = Date.now();
  const sendNetworkSync = () => {
    lastNetworkBroadcastTime = Date.now();
    try {
      fetch('/api/display-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state),
        keepalive: true
      }).catch(() => {});
    } catch {}
  };

  if (now - lastNetworkBroadcastTime > 300) {
    sendNetworkSync();
  } else {
    if (networkBroadcastTimer) clearTimeout(networkBroadcastTimer);
    networkBroadcastTimer = setTimeout(sendNetworkSync, 200);
  }
}

/**
 * Listen for live dual display updates from the operator terminal (Local & Network)
 */
export function listenDualDisplayState(
  branchId: string,
  onUpdate: (state: DualDisplayState) => void
): () => void {
  if (typeof window === 'undefined') return () => {};

  // Check existing cached state
  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached) as DualDisplayState;
      if (!branchId || parsed.branchId === branchId || branchId === 'ALL') {
        onUpdate(parsed);
      }
    }
  } catch {}

  // 1. BroadcastChannel listener (0ms for same computer)
  let channel: BroadcastChannel | null = null;
  try {
    if ('BroadcastChannel' in window) {
      channel = new BroadcastChannel(CHANNEL_NAME);
      channel.onmessage = (event) => {
        if (event.data) {
          const s = event.data as DualDisplayState;
          if (!branchId || s.branchId === branchId || branchId === 'ALL') {
            onUpdate(s);
          }
        }
      };
    }
  } catch {}

  // 2. Storage event listener (multi-window on same computer)
  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      try {
        const s = JSON.parse(e.newValue) as DualDisplayState;
        if (!branchId || s.branchId === branchId || branchId === 'ALL') {
          onUpdate(s);
        }
      } catch {}
    }
  };
  window.addEventListener('storage', handleStorage);

  // 3. Cross-Device Real-Time Cloud Poller (For Phone / Tablet / Smart TV across Network)
  let isPolling = true;
  let lastTimestamp = 0;

  const pollNetworkState = async () => {
    if (!isPolling) return;
    try {
      const res = await fetch(`/api/display-sync?branchId=${encodeURIComponent(branchId || 'B-01')}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.state) {
          const s = data.state as DualDisplayState;
          if (s.timestamp && s.timestamp > lastTimestamp) {
            lastTimestamp = s.timestamp;
            onUpdate(s);
          }
        }
      }
    } catch {}
  };

  // Immediate fetch on mount
  pollNetworkState();
  const pollInterval = setInterval(pollNetworkState, 800);

  return () => {
    isPolling = false;
    if (channel) channel.close();
    window.removeEventListener('storage', handleStorage);
    clearInterval(pollInterval);
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// WEB BLUETOOTH HARDWARE HELPER (Weighing Scales & Milk Analyzers)
// ─────────────────────────────────────────────────────────────────────────────

export interface BluetoothDeviceInfo {
  id: string;
  name: string;
  connected: boolean;
  batteryLevel?: number;
}

/** Check if current browser supports Web Bluetooth API */
export function isWebBluetoothSupported(): boolean {
  return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
}

/**
 * Request & connect to a Bluetooth Weighing Scale / Milk Analyzer
 */
export async function connectBluetoothDevice(
  onWeightReceived?: (weight: number) => void
): Promise<{ device: any; name: string } | null> {
  if (!isWebBluetoothSupported()) {
    throw new Error('Web Bluetooth is not supported in this browser. Please use Google Chrome or Microsoft Edge.');
  }

  try {
    const nav = navigator as any;
    const device = await nav.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: [
        'battery_service',
        '0000181d-0000-1000-8000-00805f9b34fb', // Standard Weight Scale Service
        '0000ffe0-0000-1000-8000-00805f9b34fb', // Standard Serial BLE Service
        '0000fff0-0000-1000-8000-00805f9b34fb'  // Custom Scale Service
      ]
    });

    if (!device) return null;

    const server = await device.gatt?.connect();
    const deviceName = device.name || 'Digital Scale (BLE)';

    // Attempt to listen to standard weight characteristic if available
    try {
      const services = await server?.getPrimaryServices();
      if (services) {
        for (const service of services) {
          const chars = await service.getCharacteristics();
          for (const char of chars) {
            if (char.properties.notify || char.properties.indicate) {
              await char.startNotifications();
              char.addEventListener('characteristicvaluechanged', (e: any) => {
                const value = e.target.value;
                const parsedWeight = parseBluetoothScaleValue(value);
                if (parsedWeight !== null && onWeightReceived) {
                  onWeightReceived(parsedWeight);
                }
              });
            }
          }
        }
      }
    } catch {}

    return { device, name: deviceName };
  } catch (err: any) {
    if (err.name === 'NotFoundError') {
      return null; // User cancelled the picker
    }
    throw err;
  }
}

/** Parse raw Bluetooth GATT ArrayBuffer to weight in kg/L */
export function parseBluetoothScaleValue(dataView: DataView): number | null {
  try {
    // Try IEEE-11073 16-bit float / standard scale format
    if (dataView.byteLength >= 2) {
      const raw = dataView.getUint16(0, true);
      const val = raw / 100; // Common 2-decimal scale
      if (val > 0 && val < 500) return Math.round(val * 10) / 10;
    }
    // Try ASCII string format (many Chinese & Indian weighing indicators send ASCII "ST,GS,+0012.50kg")
    const decoder = new TextDecoder('utf-8');
    const text = decoder.decode(dataView.buffer);
    const match = text.match(/[-+]?\d+(\.\d+)?/);
    if (match) {
      const val = parseFloat(match[0]);
      if (!isNaN(val) && val >= 0 && val < 500) {
        return Math.round(val * 10) / 10;
      }
    }
  } catch {}
  return null;
}
