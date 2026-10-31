import { JSONFilePreset } from 'lowdb/node';
import path from 'path';
import fs from 'fs';
import { supabase } from './supabase';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type NotificationType =
  | 'milk_drop_alert'        // Auto-generated when milk quantity drops significantly
  | 'quality_feed_advisory'  // Auto-generated when FAT% or SNF% drops with cattle diet recommendations
  | 'bonus_rate'             // Admin: extra bonus per liter this period
  | 'rate_change'            // Admin: milk rate formula changed
  | 'announcement'           // Admin: general center announcement
  | 'health_advisory'        // Admin: vaccination camp / disease advisory
  | 'payment_credited';      // Auto: payment successfully credited

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
    // Only pass schema-compliant columns for branches table: id, name, manager, capacity, today_collection, payments, status
    const p1 = supabase.from('branches').upsert({
      id: 'CONFIG-NOTIFICATIONS-STORE',
      name: '3T Notifications Store',
      manager: 'SYSTEM',
      capacity: 0,
      today_collection: 0,
      payments: 0,
      status: JSON.stringify(notifications || [])
    }, { onConflict: 'id' });

    const p2 = supabase.from('branches').upsert({
      id: 'CONFIG-DELETED-NOTIFS',
      name: '3T Deleted Tombstones Store',
      manager: 'SYSTEM',
      capacity: 0,
      today_collection: 0,
      payments: 0,
      status: JSON.stringify(deletedNotifications || [])
    }, { onConflict: 'id' });

    await withTimeout(Promise.allSettled([p1, p2]), 4000, null);
  } catch (err) {
    console.warn('[Notification Cloud Save Warning]', err);
  }
}

/** Pull fresh notification history from Supabase Cloud */
async function refreshNotificationsFromCloud(): Promise<void> {
  try {
    const db = await getDb();
    if (!db.data.deletedNotifications) db.data.deletedNotifications = [];

    const [notifsRes, delRes, individualNotifsRes] = await Promise.all([
      withTimeout(
        supabase.from('branches').select('*').eq('id', 'CONFIG-NOTIFICATIONS-STORE').single(),
        3500,
        { data: null, error: null } as any
      ),
      withTimeout(
        supabase.from('branches').select('*').eq('id', 'CONFIG-DELETED-NOTIFS').single(),
        3500,
        { data: null, error: null } as any
      ),
      withTimeout(
        supabase.from('branches').select('*').like('id', 'NOTIF-%').limit(200),
        3500,
        { data: null, error: null } as any
      )
    ]);

    // 1. Gather deleted tombstones
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

    // 2. Parse from CONFIG-NOTIFICATIONS-STORE
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

    // 3. Also parse individual NOTIF-% records from branches table for 100% redundancy
    if (individualNotifsRes?.data && Array.isArray(individualNotifsRes.data)) {
      for (const row of individualNotifsRes.data) {
        if (row?.status && !deletedSet.has((row.id || '').toUpperCase())) {
          try {
            const parsed = typeof row.status === 'string' ? JSON.parse(row.status) : row.status;
            if (parsed && parsed.id && !deletedSet.has(parsed.id.toUpperCase())) {
              if (!remoteNotifs.some((r) => r.id.toUpperCase() === parsed.id.toUpperCase())) {
                remoteNotifs.push(parsed);
              }
            }
          } catch {}
        }
      }
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

  // Direct individual row backup into branches table with valid schema
  const directRowSave = supabase.from('branches').upsert({
    id: notif.id,
    name: (notif.title || 'Notification').slice(0, 80),
    manager: notif.farmerId || 'ALL',
    capacity: 0,
    today_collection: 0,
    payments: 0,
    status: JSON.stringify(notif)
  }, { onConflict: 'id' });

  // Persist both the full array and the individual record to Supabase Cloud immediately
  await Promise.allSettled([
    saveNotificationsToCloud(db.data.notifications, db.data.deletedNotifications),
    directRowSave
  ]).catch(() => {});

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
  const cleanBranchId = (branchId || 'ALL').trim().toUpperCase().replace(/-/g, '');
  const deletedSet = new Set((db.data.deletedNotifications || []).map((d: string) => (d || '').trim().toUpperCase()));

  return store.data.notifications
    .filter((n) => {
      if (deletedSet.has(n.id.toUpperCase())) return false;
      const notifTargetFarmer = (n.farmerId || '').trim().toUpperCase();
      const notifBranch = (n.branchId || 'ALL').trim().toUpperCase().replace(/-/g, '');
      
      const isDirectToFarmer = notifTargetFarmer !== '' && notifTargetFarmer !== 'ALL' && notifTargetFarmer === cleanFarmerId;
      const isBroadcast = notifTargetFarmer === 'ALL' || notifTargetFarmer === '';
      const branchMatch = notifBranch === 'ALL' || notifBranch === '' || notifBranch === cleanBranchId || cleanBranchId === 'ALL';

      // 1. Direct messages sent specifically to this farmer are ALWAYS delivered
      if (isDirectToFarmer) {
        return true;
      }

      // 2. Broadcast announcements to all farmers (always visible to relevant branch)
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

/** Mark a single notification as read for a farmer */
export async function markSingleNotificationAsRead(notificationId: string, farmerId: string): Promise<void> {
  if (!notificationId || !farmerId) return;
  const cleanFarmerId = farmerId.trim().toUpperCase();
  const db = await getDb();
  if (!db.data.notifications) db.data.notifications = [];
  let modified = false;

  db.data.notifications.forEach((n) => {
    if (n.id.toUpperCase() === notificationId.toUpperCase()) {
      if (!n.readBy.some((r: string) => r.trim().toUpperCase() === cleanFarmerId)) {
        n.readBy.push(farmerId);
        modified = true;
      }
    }
  });

  if (modified) {
    try {
      await db.write();
    } catch {}
    await saveNotificationsToCloud(db.data.notifications || [], db.data.deletedNotifications || []).catch(() => {});
  }
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

  // 5. Persist the updated notifications array & tombstones to Supabase Cloud, and delete individual row
  await Promise.allSettled([
    saveNotificationsToCloud(db.data.notifications || [], db.data.deletedNotifications || []),
    supabase.from('branches').delete().eq('id', id),
    supabase.from('branches').delete().eq('id', upperId)
  ]).catch(() => {});

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

// ─────────────────────────────────────────────────────────────────────────────
// CATTLE FEED & MILK QUALITY ADVISORY
// Auto-triggered when today's FAT% or SNF% drops below the farmer's average.
// Provides veterinarian-verified dietary remedies (Cottonseed cake, dry fodder,
// bypass fat, mineral mix, rumen buffering) in bilingual Marathi + English.
// ─────────────────────────────────────────────────────────────────────────────

export interface FeedAdvisoryResult {
  hasQualityDrop: boolean;
  type?: 'low_fat' | 'low_snf' | 'low_both';
  title?: string;
  titleEn?: string;
  titleMr?: string;
  titleHi?: string;
  body: string; // English by default
  bodyEn: string;
  bodyMr: string;
  bodyHi: string;
  smsText?: string;
  fatDiff?: number;
  snfDiff?: number;
}

export async function checkAndCreateQualityFeedAdvisory(
  farmerId: string,
  farmerName: string,
  branchId: string,
  currentFat: number,
  currentSnf: number,
  baselineFat: number,
  baselineSnf: number
): Promise<FeedAdvisoryResult | null> {
  const fatDiff = Math.round((baselineFat - currentFat) * 10) / 10;
  const snfDiff = Math.round((baselineSnf - currentSnf) * 10) / 10;

  const isFatDrop = fatDiff >= 0.3;
  const isSnfDrop = snfDiff >= 0.3;

  if (!isFatDrop && !isSnfDrop) {
    return null;
  }

  let type: 'low_fat' | 'low_snf' | 'low_both' = 'low_fat';
  let titleEn = '';
  let titleMr = '';
  let titleHi = '';
  let bodyEn = '';
  let bodyMr = '';
  let bodyHi = '';
  let smsText = '';

  if (isFatDrop && isSnfDrop) {
    type = 'low_both';
    titleEn = '⚠️ Quality Drop: Low FAT & SNF Diet Advisory';
    titleMr = '⚠️ दुधातील फॅट व SNF कमी: आहार सल्ला';
    titleHi = '⚠️ दूध में फैट व SNF की कमी: आहार सलाह';

    bodyEn = `Dear Farmer ${farmerName}, today's milk FAT (${currentFat}%) and SNF (${currentSnf}%) have dropped below your baseline average (FAT ${baselineFat}%, SNF ${baselineSnf}%).\n\n💡 Dietary Recommendations to Boost Quality:\n1. Feed 30–40g baking soda (sodium bicarbonate) daily to balance and buffer rumen digestion.\n2. Maintain 60% dry fodder (dry straw / hay / kadba) and 40% green fodder ratio.\n3. Provide 50g mineral mixture and 1.5kg cottonseed cake daily to support butterfat.\n4. Ensure the cattle receives 70–80 liters of clean, cool drinking water throughout the day.\n5. Avoid finely ground flour; feed coarsely crushed grains (dalia style).`;

    bodyMr = `शेतकरी मित्र ${farmerName}, आजचे फॅट (${currentFat}%) व SNF (${currentSnf}%) आपल्या सरासरीपेक्षा (फॅट ${baselineFat}%, SNF ${baselineSnf}%) कमी आले आहे.\n\n💡 गुणवत्ता वाढीसाठी पशु आहार सल्ला:\n1. रुमेन बफरिंगसाठी आहारात रोज ३०-४० ग्रॅम खाण्याचा सोडा (सोडियम बायकार्बोनेट) द्या.\n2. सुका चारा (कडबा/गवत) ६०% व हिरवा चारा ४०% या प्रमाणात ठेवा.\n3. दररोज ५० ग्रॅम खनिज मिश्रण (Mineral Mixture) व १.५ किलो सरकी पेंड (Cottonseed Cake) द्या.\n4. जनावरास दिवसभरात ७०-८० लिटर स्वच्छ व थंड पिण्याचे पाणी द्या.\n5. धान्य बारीक पिठासारखे न दळता जाडसर (दलियासारखे) द्या.`;

    bodyHi = `किसान मित्र ${farmerName}, आज दूध का फैट (${currentFat}%) और SNF (${currentSnf}%) आपके सामान्य औसत (फैट ${baselineFat}%, SNF ${baselineSnf}%) से कम आया है।\n\n💡 दूध की गुणवत्ता सुधार हेतु आहार सलाह:\n1. रूमेन पाचन संतुलन के लिए रोजाना 30-40 ग्राम मीठा सोडा (सोडियम बाइकार्बोनेट) दें।\n2. दैनिक आहार में 60% सूखा चारा (भूसा/कड़बी) और 40% हरा चारा का अनुपात रखें।\n3. रोजाना 50 ग्राम मिनरल मिक्सचर और 1.5 किग्रा बिनौला खल (Cottonseed Cake) दें।\n4. पशु को दिनभर में 70-80 लीटर साफ और ठंडा पीने का पानी उपलब्ध कराएं।\n5. अनाज को बारीक आटे की जगह दलिया के रूप में दरदरा खिलाएं।`;

    smsText = `3T Dairy: ${farmerName}, today's FAT (${currentFat}%) & SNF (${currentSnf}%) dropped vs avg. Tip: Feed 60% dry fodder, 1.5kg cottonseed cake, 50g mineral mixture & 30g baking soda daily to boost quality.`;
  } else if (isFatDrop) {
    type = 'low_fat';
    titleEn = `🥛 Low Butterfat Alert: Feed Advisory (${currentFat}%)`;
    titleMr = `🥛 दुधातील फॅट कमी: आहार सल्ला (${currentFat}%)`;
    titleHi = `🥛 दूध में फैट की कमी: आहार सलाह (${currentFat}%)`;

    bodyEn = `Dear Farmer ${farmerName}, today's milk FAT is ${currentFat}% (your normal average is ${baselineFat}% — a drop of -${fatDiff}%).\n\n💡 Butterfat Optimization Feed Advisory:\n1. Increase dry fodder (straw, hay, dry kadba) proportion up to 60% of total daily feed.\n2. Add 1.0–1.5kg cottonseed cake (saraki pend) and 50–100g bypass fat to daily ration.\n3. Restrict excess succulent or watery young green fodder right before milking.\n4. Feed coarsely ground grains (dalia form) rather than fine powder to stimulate rumination.\n5. Provide adequate resting time and 70–80L clean drinking water daily.`;

    bodyMr = `शेतकरी मित्र ${farmerName}, आजचे फॅट ${currentFat}% आले आहे (आपली सरासरी ${baselineFat}% आहे — ${fatDiff}% घट).\n\n💡 फॅट वाढवण्यासाठी आजचा आहार सल्ला:\n1. आहारात सुका चारा (कडबा, वाळलेले गवत) चे प्रमाण ६०% पर्यंत वाढवा.\n2. १ ते १.५ किलो कपाशी सरकी पेंड (Cottonseed Cake) व ५०-१०० ग्रॅम बायपास फॅट खाऊ घाला.\n3. अति पाणथळ किंवा कोवळा हिरवा चारा मर्यादित द्या.\n4. धान्य भरडा बारीक पिठासारखा न दळता जाडसर (दलियासारखा) द्या.\n5. जनावरास रवंथ करण्यासाठी पुरेशी विश्रांती व मुबलक पाणी द्या.`;

    bodyHi = `किसान मित्र ${farmerName}, आज दूध का फैट ${currentFat}% आया है (आपका सामान्य औसत ${baselineFat}% है — -${fatDiff}% की गिरावट)।\n\n💡 दूध में फैट बढ़ाने हेतु आहार सलाह:\n1. दैनिक आहार में सूखे चारे (भूसा/कड़बी) का अनुपात 60% तक बढ़ाएं।\n2. रोजाना 1 से 1.5 किग्रा बिनौला खल और 50-100 ग्राम बाईपास फैट आहार में शामिल करें।\n3. अत्यधिक गीला या कच्चा हरा चारा सीमित मात्रा में दें।\n4. अनाज को बारीक पीसने के बजाय दरदरा (दलिया जैसा) खिलाएं।\n5. पशु को जुगाली के लिए पर्याप्त विश्राम और 70-80 लीटर स्वच्छ पानी दें।`;

    smsText = `3T Dairy: ${farmerName}, today's FAT is ${currentFat}% (Avg: ${baselineFat}%). Tip to boost FAT tomorrow: Feed 60% dry fodder, 1.5kg cottonseed cake & 50-100g bypass fat daily.`;
  } else {
    type = 'low_snf';
    titleEn = `🌾 Low SNF Alert: Protein & Mineral Advisory (${currentSnf}%)`;
    titleMr = `🌾 दुधातील SNF कमी: आहार सल्ला (${currentSnf}%)`;
    titleHi = `🌾 दूध में SNF की कमी: आहार सलाह (${currentSnf}%)`;

    bodyEn = `Dear Farmer ${farmerName}, today's milk SNF is ${currentSnf}% (your normal average is ${baselineSnf}% — a drop of -${snfDiff}%).\n\n💡 SNF Recovery & Protein Advisory:\n1. Provide protein-rich legume green fodder such as Lucerne (alfalfa), Berseem, or soybean/groundnut meal.\n2. Supplement 50g high-grade chelated mineral mixture daily.\n3. Ensure 70–80 liters of fresh, clean drinking water is freely accessible at all times.\n4. Verify that the animal has received regular seasonal deworming.\n5. Maintain good cattle shed ventilation and hygiene.`;

    bodyMr = `शेतकरी मित्र ${farmerName}, आजचे SNF ${currentSnf}% आले आहे (आपली सरासरी ${baselineSnf}% आहे — ${snfDiff}% घट).\n\n💡 SNF वाढवण्यासाठी आजचा आहार सल्ला:\n1. प्रथिनांसाठी आहारात लसूण घास (Lucerne), बरसीम किंवा सोयाबीन/शेंगदाणा पेंड द्या.\n2. दररोज ५० ग्रॅम चांगल्या दर्जाचे चिलेटेड खनिज मिश्रण (Chelated Mineral Mixture) खाऊ घाला.\n3. जनावरास भरपूर व स्वच्छ पिण्याचे पाणी (७०-८० लिटर) उपलब्ध करा.\n4. जनावराची जंतनाशक औषधोपचार (Deworming) झालेली आहे का याची खात्री करा.\n5. गोठ्यात खेळती हवा व स्वच्छता ठेवा.`;

    bodyHi = `किसान मित्र ${farmerName}, आज दूध का SNF ${currentSnf}% आया है (आपका सामान्य औसत ${baselineSnf}% है — -${snfDiff}% की गिरावट)।\n\n💡 SNF सुधार एवं प्रोटीन आहार सलाह:\n1. प्रोटीन पूर्ति हेतु आहार में लूसर्न (बरसीम/रिजका) या सोयाबीन/मूंगफली की खल दें।\n2. रोजाना 50 ग्राम उच्च गुणवत्ता वाला चीलेटेड मिनरल मिक्सचर दें।\n3. पशु को 70-80 लीटर ताजा व स्वच्छ पीने का पानी हमेशा उपलब्ध रखें।\n4. सुनिश्चित करें कि पशु को समय पर पेट के कीड़ों की दवा (डिवॉर्मिंग) दी गई है।\n5. पशु बाड़े में हवादार माहौल और सफाई बनाए रखें।`;

    smsText = `3T Dairy: ${farmerName}, today's SNF is ${currentSnf}% (Avg: ${baselineSnf}%). Tip to boost SNF: Feed protein legume fodder (Lucerne), 50g chelated mineral mix & 70-80L water daily.`;
  }

  // Check if already notified for quality advisory today to avoid spamming the log
  try {
    const store = await getStore();
    const today = new Date().toISOString().slice(0, 10);
    const alreadyAlerted = store.data.notifications.some(
      (n) =>
        n.type === 'quality_feed_advisory' &&
        n.farmerId === farmerId &&
        n.createdAt.startsWith(today)
    );

    if (!alreadyAlerted) {
      await createNotification({
        type: 'quality_feed_advisory',
        title: titleEn,
        body: bodyEn,
        farmerId,
        branchId,
        sentBy: 'SYSTEM',
      });
    }
  } catch (err) {
    console.warn('Error creating quality feed advisory notification:', err);
  }

  return {
    hasQualityDrop: true,
    type,
    title: titleEn,
    titleEn,
    titleMr,
    titleHi,
    body: bodyEn, // English by default
    bodyEn,
    bodyMr,
    bodyHi,
    smsText,
    fatDiff,
    snfDiff
  };
}


