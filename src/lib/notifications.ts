import { JSONFilePreset } from 'lowdb/node';
import path from 'path';
import fs from 'fs';
import { supabase } from './supabase';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type NotificationType =
  | 'milk_drop_alert'   // Auto-generated when milk quantity drops significantly
  | 'bonus_rate'        // Admin: extra bonus per liter this period
  | 'rate_change'       // Admin: milk rate formula changed
  | 'announcement'      // Admin: general center announcement
  | 'health_advisory'   // Admin: vaccination camp / disease advisory
  | 'payment_credited'; // Auto: payment successfully credited

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  farmerId: string | 'ALL'; // 'ALL' means broadcast to every farmer
  branchId: string | 'ALL'; // 'ALL' means all branches
  createdAt: string;        // ISO timestamp
  readBy: string[];         // list of farmerIds who have read this
  sentBy: string;           // 'SYSTEM' or admin email
}

// ─────────────────────────────────────────────────────────────────────────────
// PERSISTENCE (Hybrid Supabase Cloud + Memory store + Local fallback)
// ─────────────────────────────────────────────────────────────────────────────

interface NotificationSchema {
  notifications: Notification[];
}

const isServerless = process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME !== undefined;
const dataDir = isServerless ? path.join('/tmp', '3t_data') : path.join(process.cwd(), 'data');
try {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
} catch {}
const notifPath = path.join(dataDir, 'notifications.json');

async function withTimeout<T>(promise: PromiseLike<T> | Promise<T>, ms = 2500, fallback: T): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<T>((resolve) => {
    timer = setTimeout(() => resolve(fallback), ms);
  });
  try {
    const result = await Promise.race([Promise.resolve(promise), timeoutPromise]);
    clearTimeout(timer!);
    return result;
  } catch {
    clearTimeout(timer!);
    return fallback;
  }
}

import { getDb } from './db';

// Initial seed from bundled data/notifications.json
let initialSeed: Notification[] = [];
try {
  const seedFile = path.join(process.cwd(), 'data', 'notifications.json');
  if (fs.existsSync(seedFile)) {
    const raw = fs.readFileSync(seedFile, 'utf-8');
    const parsed = jsonParse(raw);
    if (parsed && Array.isArray(parsed.notifications)) {
      initialSeed = parsed.notifications;
    }
  }
} catch {}

function jsonParse(str: string) {
  try { return JSON.parse(str); } catch { return null; }
}

async function getStore() {
  const db = await getDb();
  if (!db.data.deletedNotifications) db.data.deletedNotifications = [];
  const deletedSet = new Set(db.data.deletedNotifications.map((d: string) => (d || '').trim().toUpperCase()));

  if (!db.data.notifications || db.data.notifications.length === 0) {
    db.data.notifications = initialSeed.filter((n) => !deletedSet.has(n.id.toUpperCase()));
  } else {
    db.data.notifications = db.data.notifications.filter((n) => !deletedSet.has(n.id.toUpperCase()));
  }

  return {
    data: { notifications: db.data.notifications },
    write: async () => {
      await db.write().catch(() => {});
    }
  };
}

/** Atomic save of all active notifications & deleted tombstones to Supabase Cloud */
async function saveNotificationsToCloud(notifications: Notification[], deletedNotifications: string[]): Promise<void> {
  try {
    const p1 = supabase.from('branches').upsert({
      id: 'CONFIG-NOTIFICATIONS-STORE',
      name: '3T Notifications Store',
      manager: 'SYSTEM',
      phone: '0000000000',
      location: 'Cloud',
      active_farmers: 0,
      daily_volume: 0,
      status: JSON.stringify(notifications)
    });

    const p2 = supabase.from('branches').upsert({
      id: 'CONFIG-DELETED-NOTIFS',
      name: '3T Deleted Tombstones Store',
      manager: 'SYSTEM',
      phone: '0000000000',
      location: 'Cloud',
      active_farmers: 0,
      daily_volume: 0,
      status: JSON.stringify(deletedNotifications || [])
    });

    await withTimeout(Promise.allSettled([p1, p2]), 2500, null);
  } catch (err) {
    console.warn('[Notification Cloud Save Warning]', err);
  }
}

/** Pull fresh notification history from Supabase Cloud */
async function refreshNotificationsFromCloud(): Promise<void> {
  try {
    const db = await getDb();
    if (!db.data.deletedNotifications) db.data.deletedNotifications = [];

    const [notifsRes, delRes] = await Promise.all([
      withTimeout(
        supabase.from('branches').select('*').eq('id', 'CONFIG-NOTIFICATIONS-STORE').single(),
        2500,
        { data: null, error: null } as any
      ),
      withTimeout(
        supabase.from('branches').select('*').eq('id', 'CONFIG-DELETED-NOTIFS').single(),
        2500,
        { data: null, error: null } as any
      )
    ]);

    // Gather deleted tombstones
    if (delRes?.data?.status) {
      try {
        const parsedDels = typeof delRes.data.status === 'string' ? JSON.parse(delRes.data.status) : delRes.data.status;
        if (Array.isArray(parsedDels)) {
          for (const item of parsedDels) {
            const did = typeof item === 'string' ? item : item?.id;
            if (did && !db.data.deletedNotifications.includes(did)) {
              db.data.deletedNotifications.push(did);
            }
          }
        }
      } catch {}
    }

    const deletedSet = new Set((db.data.deletedNotifications || []).map((d: string) => (d || '').trim().toUpperCase()));
    const remoteNotifs: Notification[] = [];

    if (notifsRes?.data?.status) {
      try {
        const parsedNotifs = typeof notifsRes.data.status === 'string' ? JSON.parse(notifsRes.data.status) : notifsRes.data.status;
        if (Array.isArray(parsedNotifs)) {
          for (const n of parsedNotifs) {
            if (n && n.id && !deletedSet.has(n.id.toUpperCase())) {
              remoteNotifs.push({
                id: n.id,
                title: n.title || 'Announcement',
                body: n.body || '',
                type: n.type || 'announcement',
                farmerId: n.farmerId || 'ALL',
                branchId: n.branchId || 'ALL',
                createdAt: n.createdAt || new Date().toISOString(),
                readBy: Array.isArray(n.readBy) ? n.readBy : [],
                sentBy: n.sentBy || 'SYSTEM'
              });
            }
          }
        }
      } catch {}
    }

    if (!db.data.notifications) db.data.notifications = [];
    initialSeed = initialSeed.filter((n) => !deletedSet.has(n.id.toUpperCase()));
    db.data.notifications = db.data.notifications.filter((n) => !deletedSet.has(n.id.toUpperCase()));

    // Merge remote notifications and local memory notifications without losing any message
    const remoteMap = new Map<string, Notification>();
    remoteNotifs.forEach((n) => remoteMap.set(n.id, n));
    db.data.notifications.forEach((n) => {
      if (!deletedSet.has(n.id.toUpperCase())) {
        if (!remoteMap.has(n.id)) {
          remoteMap.set(n.id, n);
        } else {
          // Merge readBy list
          const remote = remoteMap.get(n.id)!;
          const mergedReadBy = Array.from(new Set([...(remote.readBy || []), ...(n.readBy || [])]));
          remote.readBy = mergedReadBy;
        }
      }
    });

    db.data.notifications = Array.from(remoteMap.values());
    db.data.notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    await db.write().catch(() => {});
  } catch (err) {
    console.warn('[Notification Cloud Refresh Warning]', err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CRUD OPERATIONS
// ─────────────────────────────────────────────────────────────────────────────

/** Create and persist a new notification */
export async function createNotification(
  data: Omit<Notification, 'id' | 'createdAt' | 'readBy'>
): Promise<Notification> {
  const db = await getDb();
  if (!db.data.notifications) db.data.notifications = [];
  if (!db.data.deletedNotifications) db.data.deletedNotifications = [];

  const notif: Notification = {
    ...data,
    id: `NOTIF-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
    createdAt: new Date().toISOString(),
    readBy: [],
  };

  db.data.notifications.unshift(notif); // newest first
  if (db.data.notifications.length > 500) {
    db.data.notifications = db.data.notifications.slice(0, 500);
  }

  await db.write().catch(() => {});

  // Persist the entire updated notifications array to Supabase Cloud immediately
  await saveNotificationsToCloud(db.data.notifications, db.data.deletedNotifications).catch(() => {});

  return notif;
}

/** Get all notifications visible to a specific farmer (their own + relevant broadcasts) */
export async function getNotificationsForFarmer(
  farmerId: string,
  branchId: string,
  registeredAt?: string,
  limit = 50
): Promise<Notification[]> {
  await refreshNotificationsFromCloud();
  const db = await getDb();
  const store = await getStore();
  const cleanFarmerId = (farmerId || '').trim().toUpperCase();
  const cleanBranchId = (branchId || 'ALL').trim().toUpperCase();
  const deletedSet = new Set((db.data.deletedNotifications || []).map((d: string) => (d || '').trim().toUpperCase()));

  return store.data.notifications
    .filter((n) => {
      if (deletedSet.has(n.id.toUpperCase())) return false;
      const notifTargetFarmer = (n.farmerId || '').trim().toUpperCase();
      const notifBranch = (n.branchId || 'ALL').trim().toUpperCase();
      
      const isDirectToFarmer = notifTargetFarmer !== '' && notifTargetFarmer !== 'ALL' && notifTargetFarmer === cleanFarmerId;
      const isBroadcast = notifTargetFarmer === 'ALL' || notifTargetFarmer === '';
      const branchMatch = notifBranch === 'ALL' || notifBranch === '' || notifBranch === cleanBranchId;

      // 1. Direct messages sent specifically to this farmer (bonus, drop alert, receipts)
      if (isDirectToFarmer) {
        return branchMatch;
      }

      // 2. Broadcast announcements to all farmers (always visible, never wiped out)
      if (isBroadcast && branchMatch) {
        return true;
      }

      return false;
    })
    .slice(0, limit);
}

/** Count unread notifications for a farmer */
export async function getUnreadCount(farmerId: string, branchId: string, registeredAt?: string): Promise<number> {
  const notifs = await getNotificationsForFarmer(farmerId, branchId, registeredAt);
  const cleanFarmerId = (farmerId || '').trim().toUpperCase();
  return notifs.filter((n) => !n.readBy.some((r: string) => r.trim().toUpperCase() === cleanFarmerId)).length;
}

/** Mark all of a farmer's notifications as read */
export async function markAllAsRead(farmerId: string, branchId: string, registeredAt?: string): Promise<void> {
  const cleanFarmerId = (farmerId || '').trim().toUpperCase();
  const db = await getDb();
  if (!db.data.notifications) db.data.notifications = [];
  const visibleNotifs = await getNotificationsForFarmer(farmerId, branchId, registeredAt, 100);
  const visibleIds = new Set(visibleNotifs.map((n) => n.id));
  let modified = false;

  db.data.notifications.forEach((n) => {
    if (visibleIds.has(n.id) && !n.readBy.some((r: string) => r.trim().toUpperCase() === cleanFarmerId)) {
      n.readBy.push(farmerId);
      modified = true;
    }
  });

  if (modified) {
    try {
      await db.write();
    } catch {}
    await saveNotificationsToCloud(db.data.notifications || [], db.data.deletedNotifications || []).catch(() => {});
  }
}

/** Get all notifications (admin view) */
export async function getAllNotifications(limit = 100): Promise<Notification[]> {
  await refreshNotificationsFromCloud();
  const db = await getDb();
  const deletedSet = new Set((db.data.deletedNotifications || []).map((d: string) => (d || '').trim().toUpperCase()));
  const store = await getStore();
  return store.data.notifications
    .filter((n) => !deletedSet.has(n.id.toUpperCase()))
    .slice(0, limit);
}

/** Delete a notification by id permanently across all stores and cloud */
export async function deleteNotification(id: string): Promise<boolean> {
  if (!id) return false;
  const db = await getDb();
  if (!db.data.deletedNotifications) db.data.deletedNotifications = [];

  const upperId = id.toUpperCase();

  // 1. Record in tombstone list
  if (!db.data.deletedNotifications.includes(id)) {
    db.data.deletedNotifications.push(id);
  }
  if (!db.data.deletedNotifications.includes(upperId)) {
    db.data.deletedNotifications.push(upperId);
  }

  // 2. Remove from local store & initialSeed
  if (db.data.notifications) {
    db.data.notifications = db.data.notifications.filter((n) => n.id !== id && n.id.toUpperCase() !== upperId);
  }
  initialSeed = initialSeed.filter((n) => n.id !== id && n.id.toUpperCase() !== upperId);

  // 3. Persist local database
  try {
    await db.write();
  } catch {}

  // 4. Update bundled data files if accessible
  try {
    const seedFile = path.join(process.cwd(), 'data', 'notifications.json');
    if (fs.existsSync(seedFile)) {
      const raw = fs.readFileSync(seedFile, 'utf-8');
      const parsed = jsonParse(raw);
      if (parsed && Array.isArray(parsed.notifications)) {
        parsed.notifications = parsed.notifications.filter((n: any) => n.id !== id && n.id.toUpperCase() !== upperId);
        fs.writeFileSync(seedFile, JSON.stringify(parsed, null, 2), 'utf-8');
      }
    }
  } catch {}

  // 5. Persist the updated notifications array & tombstones to Supabase Cloud
  await saveNotificationsToCloud(db.data.notifications || [], db.data.deletedNotifications || []).catch(() => {});

  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// MILK DROP ALERT — called after every new collection is logged
// Compares latest collection weight vs 7-day average
// Auto-creates a milk_drop_alert notification if drop is significant
// ─────────────────────────────────────────────────────────────────────────────

export async function checkAndCreateMilkDropAlert(
  farmerId: string,
  farmerName: string,
  branchId: string,
  allCollections: { weight: number; date: string }[]
): Promise<void> {
  const farmerCollections = allCollections
    .filter((c: any) => c.farmerId === farmerId || c.weight !== undefined)
    .slice(0, 14); // last 14 entries

  if (farmerCollections.length < 3) return; // Not enough history to compare

  const latest = farmerCollections[0].weight;
  const previous = farmerCollections.slice(1, 8); // last 7 excluding today
  const avg7day = previous.reduce((s, c) => s + c.weight, 0) / previous.length;

  if (avg7day === 0) return;

  const dropPercent = ((avg7day - latest) / avg7day) * 100;

  // Only alert if drop is more than 20%
  if (dropPercent < 20) return;

  // Don't spam — check if we already created an alert for this farmer today
  const store = await getStore();
  const today = new Date().toISOString().slice(0, 10);
  const alreadyAlerted = store.data.notifications.some(
    (n) =>
      n.type === 'milk_drop_alert' &&
      n.farmerId === farmerId &&
      n.createdAt.startsWith(today)
  );
  if (alreadyAlerted) return;

  const severity = dropPercent >= 40 ? '🔴 Critical' : dropPercent >= 25 ? '🟠 Warning' : '🟡 Alert';
  const dropStr = dropPercent.toFixed(0);

  await createNotification({
    type: 'milk_drop_alert',
    title: `${severity}: Milk Drop Detected`,
    body: `${farmerName}, today's milk (${latest.toFixed(1)}L) dropped by ${dropStr}% compared to your 7-day average (${avg7day.toFixed(1)}L). Please check your cattle health. Open AI Mitra for guidance.`,
    farmerId,
    branchId,
    sentBy: 'SYSTEM',
  });
}

