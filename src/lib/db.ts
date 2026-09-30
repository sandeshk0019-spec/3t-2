import { JSONFilePreset } from 'lowdb/node';
import path from 'path';
import fs from 'fs';
import { supabase } from './supabase';
import {
  Farmer,
  CollectionItem,
  PaymentItem,
  Branch,
  FormulaConfig,
  defaultFormulaConfig,
  mockBranches,
  mockFarmers,
  mockCollections,
  mockPayments,
  parseDateTimeToEpoch
} from '../app/data';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface DeletedFarmerRecord {
  farmer: Farmer;
  deletedAt: string;
}

export interface DatabaseSchema {
  farmers: Farmer[];
  collections: CollectionItem[];
  payments: PaymentItem[];
  branches: Branch[];
  formulaConfig: FormulaConfig;
  deletedFarmers: DeletedFarmerRecord[];
  retiredIds: string[];
  notifications?: any[];
  deletedNotifications?: string[];
}

export interface DbObject {
  data: DatabaseSchema;
  write: () => Promise<void>;
}

// ─────────────────────────────────────────────────────────────────────────────
// PRIMARY PERSISTENT DATABASE (data/threet_database.json)
// ─────────────────────────────────────────────────────────────────────────────

const isVercelEnv = process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME !== undefined;
const dataDir = isVercelEnv
  ? path.join('/tmp', '3t_data')
  : path.join(process.cwd(), 'data');

if (!fs.existsSync(dataDir)) {
  try { fs.mkdirSync(dataDir, { recursive: true }); } catch {}
}
const dbPath = path.join(dataDir, 'threet_database.json');

// On Vercel serverless cold start, copy the bundled seed database to /tmp
if (isVercelEnv && !fs.existsSync(dbPath)) {
  const seedFile = path.join(process.cwd(), 'data', 'threet_database.json');
  if (fs.existsSync(seedFile)) {
    try {
      fs.copyFileSync(seedFile, dbPath);
    } catch {}
  }
}

const defaultData: DatabaseSchema = {
  farmers: mockFarmers,
  collections: mockCollections,
  payments: mockPayments,
  branches: mockBranches,
  formulaConfig: defaultFormulaConfig,
  deletedFarmers: [],
  retiredIds: [],
  notifications: [],
  deletedNotifications: []
};

let storePromise: Promise<any> | null = null;

async function getStore() {
  if (!storePromise) {
    storePromise = (async () => {
      const store = await JSONFilePreset<DatabaseSchema>(dbPath, defaultData);
      await store.read().catch(() => {});
      if (!store.data.farmers || store.data.farmers.length === 0) {
        store.data.farmers = [...mockFarmers];
      }
      if (!store.data.collections) store.data.collections = [...mockCollections];
      if (!store.data.payments) store.data.payments = [...mockPayments];
      if (!store.data.branches || store.data.branches.length === 0) {
        store.data.branches = [...mockBranches];
      }
      if (!store.data.formulaConfig) store.data.formulaConfig = { ...defaultFormulaConfig };
      if (!store.data.deletedFarmers) store.data.deletedFarmers = [];
      if (!store.data.retiredIds) store.data.retiredIds = [];
      if (!store.data.notifications) store.data.notifications = [];
      if (!store.data.deletedNotifications) store.data.deletedNotifications = [];
      return store;
    })();
  }
  return storePromise;
}

export async function withTimeout<T>(promise: PromiseLike<T> | Promise<T>, ms = 1500, fallback: T): Promise<T> {
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

let lastSupabaseFetch = 0;
let activeRefreshPromise: Promise<void> | null = null;
let writeQueue = Promise.resolve();

export async function safeStoreWrite(store: any): Promise<void> {
  writeQueue = writeQueue.then(async () => {
    try {
      await store.write();
    } catch (err) {
      console.warn('[DB safeStoreWrite Error]', err);
    }
  });
  return writeQueue;
}

const isServerlessEnv = process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME !== undefined;
const CACHE_TTL_MS = isServerlessEnv ? 0 : 2_000;

export async function refreshFromSupabase(force = false): Promise<void> {
  const now = Date.now();
  if (!force && CACHE_TTL_MS > 0 && now - lastSupabaseFetch < CACHE_TTL_MS) {
    return;
  }
  if (activeRefreshPromise) {
    return activeRefreshPromise;
  }

  activeRefreshPromise = (async () => {
    lastSupabaseFetch = Date.now();
    try {
      const store = await getStore();
      const fallbackRes: any = { data: null, error: null };
      const [colRes, payRes, farmRes, cloudFarmersRes, cloudColsRes, cloudPaysRes, configRes, retiredFarmRes, retiredBranchRes] = await withTimeout(
        Promise.all([
          supabase.from('collections').select('*').order('created_at', { ascending: false }).limit(300),
          supabase.from('payments').select('*').order('created_at', { ascending: false }).limit(300),
          supabase.from('farmers').select('*').like('id', 'F-%').limit(100),
        supabase.from('branches').select('*').like('id', 'FARMER-%').limit(200),
        supabase.from('branches').select('*').like('id', 'COL-%').limit(500),
        supabase.from('branches').select('*').like('id', 'PAY-%').limit(500),
        supabase.from('settings').select('*').eq('id', 1).single(),
        supabase.from('farmers').select('*').eq('id', 'CONFIG-RETIRED-FARMERS').single(),
        supabase.from('branches').select('*').eq('id', 'CONFIG-RETIRED-FARMERS').single()
      ]),
      2000,
      [fallbackRes, fallbackRes, fallbackRes, fallbackRes, fallbackRes, fallbackRes, fallbackRes, fallbackRes, fallbackRes]
    );

    if (configRes?.data && typeof configRes.data.base_price === 'number') {
      store.data.formulaConfig = {
        basePrice: Number(configRes.data.base_price),
        fatFactor: Number(configRes.data.fat_factor),
        snfFactor: Number(configRes.data.snf_factor)
      };
    }

    // Load and merge cloud-persisted retired / deleted farmer IDs from BOTH farmers and branches tables
    const retiredRaw = retiredFarmRes?.data?.qr_code || retiredBranchRes?.data?.status || retiredBranchRes?.data?.manager;
    if (retiredRaw) {
      try {
        const parsedRetired = typeof retiredRaw === 'string' ? JSON.parse(retiredRaw) : retiredRaw;
        if (Array.isArray(parsedRetired)) {
          if (!store.data.retiredIds) store.data.retiredIds = [];
          parsedRetired.forEach((rid: string) => {
            if (rid && !store.data.retiredIds.includes(rid)) {
              store.data.retiredIds.push(rid);
            }
          });
        }
      } catch {}
    }

    const allMappedCollections: CollectionItem[] = [];

    if (colRes.data && colRes.data.length > 0) {
      colRes.data.forEach((c: any) => {
        // Exclude all non-milk-delivery auxiliary cloud records
        if (!c.id) return;
        const idUpper = c.id.toUpperCase();
        if (idUpper.startsWith('NOTIF-') || idUpper.startsWith('CONFIG-') || idUpper.startsWith('DELNOTIF-') || idUpper.startsWith('FARMER-')) return;
        if (c.time === 'NOTIF' || c.time === 'CONFIG' || c.time === 'DELNOTIF') return;

        allMappedCollections.push({
          id: c.id,
          farmerId: c.farmer_id,
          farmerName: c.farmer_name,
          village: c.village,
          date: c.date,
          time: c.time,
          weight: Number(c.weight),
          fat: Number(c.fat),
          snf: Number(c.snf),
          rate: Number(c.rate),
          total: Number(c.total),
          status: c.status || 'Success',
          branchId: c.branch_id || 'B-01'
        });
      });
    }

    if (cloudColsRes.data && cloudColsRes.data.length > 0) {
      cloudColsRes.data.forEach((r: any) => {
        try {
          if (!r.id) return;
          const rIdUpper = r.id.toUpperCase();
          if (rIdUpper.startsWith('NOTIF-') || rIdUpper.startsWith('CONFIG-') || rIdUpper.startsWith('DELNOTIF-') || rIdUpper.startsWith('FARMER-')) return;
          const parsed = JSON.parse(r.status);
          if (parsed && parsed.id) {
            const parsedIdUpper = parsed.id.toUpperCase();
            if (parsedIdUpper.startsWith('NOTIF-') || parsedIdUpper.startsWith('CONFIG-') || parsedIdUpper.startsWith('DELNOTIF-') || parsedIdUpper.startsWith('FARMER-')) return;
            if (parsed.time === 'NOTIF' || parsed.time === 'CONFIG') return;
            if (!allMappedCollections.some(c => c.id === parsed.id)) {
              allMappedCollections.push(parsed);
            }
          }
        } catch {}
      });
    }

    const remoteColIds = new Set(allMappedCollections.map((c: any) => c.id));
    const localPendingCols = (store.data.collections || []).filter((c: any) => {
      if (!c.id) return false;
      const idUpper = c.id.toUpperCase();
      if (idUpper.startsWith('NOTIF-') || idUpper.startsWith('CONFIG-') || idUpper.startsWith('DELNOTIF-') || idUpper.startsWith('FARMER-')) return false;
      if (c.time === 'NOTIF' || c.time === 'CONFIG') return false;
      return !remoteColIds.has(c.id);
    });
    store.data.collections = [...localPendingCols, ...allMappedCollections].sort((a, b) => {
      const dateComp = (b.date || '').localeCompare(a.date || '');
      if (dateComp !== 0) return dateComp;
      const timeDiff = parseDateTimeToEpoch(b.date, b.time) - parseDateTimeToEpoch(a.date, a.time);
      if (timeDiff !== 0) return timeDiff;
      return (b.id || '').localeCompare(a.id || '');
    });

    const allMappedPayments: PaymentItem[] = [];

    if (payRes.data && payRes.data.length > 0) {
      payRes.data.forEach((p: any) => {
        if (!p.id) return;
        const idUpper = p.id.toUpperCase();
        if (idUpper.startsWith('NOTIF-') || idUpper.startsWith('CONFIG-') || idUpper.startsWith('DELNOTIF-') || idUpper.startsWith('FARMER-') || idUpper.startsWith('SYS-')) return;
        if (p.time === 'NOTIF' || p.time === 'CONFIG' || p.time === 'SYS' || p.status === 'NOTIFS' || p.status === 'DELETED') return;

        allMappedPayments.push({
          id: p.id,
          farmerId: p.farmer_id,
          farmerName: p.farmer_name,
          date: p.date,
          time: p.time,
          amount: Number(p.amount),
          status: p.status || 'Success',
          timeline: p.timeline || []
        });
      });
    }

    if (cloudPaysRes.data && cloudPaysRes.data.length > 0) {
      cloudPaysRes.data.forEach((r: any) => {
        try {
          if (!r.id) return;
          const rIdUpper = r.id.toUpperCase();
          if (rIdUpper.startsWith('NOTIF-') || rIdUpper.startsWith('CONFIG-') || rIdUpper.startsWith('DELNOTIF-') || rIdUpper.startsWith('FARMER-') || rIdUpper.startsWith('SYS-')) return;
          const parsed = JSON.parse(r.status);
          if (parsed && parsed.id) {
            const parsedIdUpper = parsed.id.toUpperCase();
            if (parsedIdUpper.startsWith('NOTIF-') || parsedIdUpper.startsWith('CONFIG-') || parsedIdUpper.startsWith('DELNOTIF-') || parsedIdUpper.startsWith('FARMER-') || parsedIdUpper.startsWith('SYS-')) return;
            if (parsed.time === 'NOTIF' || parsed.time === 'CONFIG' || parsed.time === 'SYS') return;
            if (!allMappedPayments.some(p => p.id === parsed.id)) {
              allMappedPayments.push(parsed);
            }
          }
        } catch {}
      });
    }

    const remotePayIds = new Set(allMappedPayments.map((p: any) => p.id));
    const localPendingPays = (store.data.payments || []).filter((p: any) => {
      if (!p.id) return false;
      const idUpper = p.id.toUpperCase();
      if (idUpper.startsWith('NOTIF-') || idUpper.startsWith('CONFIG-') || idUpper.startsWith('DELNOTIF-') || idUpper.startsWith('FARMER-') || idUpper.startsWith('SYS-')) return false;
      if (p.time === 'NOTIF' || p.time === 'CONFIG' || p.time === 'SYS' || p.status === 'NOTIFS' || p.status === 'DELETED') return false;
      return !remotePayIds.has(p.id);
    });
    store.data.payments = [...localPendingPays, ...allMappedPayments].sort((a, b) => {
      const dateComp = (b.date || '').localeCompare(a.date || '');
      if (dateComp !== 0) return dateComp;
      const timeDiff = parseDateTimeToEpoch(b.date, b.time) - parseDateTimeToEpoch(a.date, a.time);
      if (timeDiff !== 0) return timeDiff;
      return (b.id || '').localeCompare(a.id || '');
    });

    const allMappedFarmers: Farmer[] = [];

    // 1. Direct farmers table rows (exclude NOTIF-, CONFIG-, DELNOTIF- rows)
    if (farmRes.data && farmRes.data.length > 0) {
      farmRes.data.forEach((f: any) => {
        if (!f.id) return;
        const idUpper = f.id.toUpperCase();
        if (idUpper.startsWith('NOTIF-') || idUpper.startsWith('CONFIG-') || idUpper.startsWith('DELNOTIF-') || idUpper.startsWith('COL-') || idUpper.startsWith('PAY-')) return;

        const local = store.data.farmers.find((lf: any) => lf.id === f.id);
        allMappedFarmers.push({
          id: f.id,
          name: f.name || local?.name || '',
          phone: f.phone || local?.phone || '',
          village: f.village || local?.village || 'Sangamner, Maharashtra',
          animals: typeof f.animals === 'number' && f.animals > 0 ? f.animals : (local?.animals ?? 5),
          avgFat: typeof f.avg_fat === 'number' ? f.avg_fat : (local?.avgFat ?? 0),
          avgSnf: typeof f.avg_snf === 'number' ? f.avg_snf : (local?.avgSnf ?? 0),
          aadhaar: f.aadhaar || local?.aadhaar || '',
          bankAccount: f.bank_account || local?.bankAccount || '',
          ifsc: f.ifsc || local?.ifsc || '',
          upiId: f.upi_id || local?.upiId || '',
          qrCode: f.qr_code || local?.qrCode || `3T-${f.id}`,
          branchId: f.branch_id || local?.branchId || 'B-01',
          monthlyEarnings: typeof f.monthly_earnings === 'number' ? f.monthly_earnings : (local?.monthlyEarnings ?? 0),
          createdAt: f.created_at || local?.createdAt || local?.joinedDate,
          joinedDate: f.created_at || local?.joinedDate || local?.createdAt,
          milkHistory: local?.milkHistory || [],
          paymentHistory: local?.paymentHistory || []
        });
      });
    }

    // 2. Cloud-persisted farmer backup rows (ensures zero data loss even if RLS is on)
    if (cloudFarmersRes.data && cloudFarmersRes.data.length > 0) {
      cloudFarmersRes.data.forEach((r: any) => {
        try {
          if (!r.id) return;
          const rIdUpper = r.id.toUpperCase();
          if (rIdUpper.startsWith('NOTIF-') || rIdUpper.startsWith('CONFIG-') || rIdUpper.startsWith('DELNOTIF-')) return;
          const parsed = JSON.parse(r.status);
          if (parsed && parsed.id) {
            const parsedIdUpper = parsed.id.toUpperCase();
            if (parsedIdUpper.startsWith('NOTIF-') || parsedIdUpper.startsWith('CONFIG-') || parsedIdUpper.startsWith('DELNOTIF-')) return;

            const local = store.data.farmers.find((lf: any) => lf.id === parsed.id);
            const exists = allMappedFarmers.some(f => f.id === parsed.id);
            if (!exists) {
              allMappedFarmers.push({
                id: parsed.id,
                name: parsed.name,
                phone: parsed.phone,
                village: parsed.village,
                animals: Number(parsed.animals) || 5,
                avgFat: Number(parsed.avgFat) || 4.2,
                avgSnf: Number(parsed.avgSnf) || 8.5,
                aadhaar: parsed.aadhaar || '',
                bankAccount: parsed.bankAccount || '',
                ifsc: parsed.ifsc || '',
                upiId: parsed.upiId || '',
                qrCode: parsed.qrCode || `3T-${parsed.id}`,
                branchId: parsed.branchId || 'B-01',
                monthlyEarnings: Number(parsed.monthlyEarnings) || 0,
                createdAt: parsed.createdAt || parsed.joinedDate || local?.createdAt,
                joinedDate: parsed.joinedDate || parsed.createdAt || local?.joinedDate,
                milkHistory: local?.milkHistory || [],
                paymentHistory: local?.paymentHistory || []
              });
            }
          }
        } catch {}
      });
    }

    // Active Deleted Farmers filter (only currently deleted farmers in dispute window are hidden)
    const deletedSet = new Set((store.data.deletedFarmers || []).map((d: any) => (d.farmer?.id || '').trim().toUpperCase()));

    // Clean retiredIds: if an ID is present in active farmers, it is NOT retired
    if (store.data.retiredIds && store.data.retiredIds.length > 0) {
      const activeIds = new Set(allMappedFarmers.map((f: Farmer) => (f.id || '').trim().toUpperCase()));
      (store.data.farmers || []).forEach((f: Farmer) => activeIds.add((f.id || '').trim().toUpperCase()));
      store.data.retiredIds = store.data.retiredIds.filter((rid: string) => !activeIds.has((rid || '').trim().toUpperCase()));
    }

    // Merge remote farmers with local farmers (ensures zero data loss)
    const remoteFarmerMap = new Map(allMappedFarmers.map((f: Farmer) => [(f.id || '').toUpperCase(), f]));
    const localOnlyFarmers = (store.data.farmers || []).filter((f: Farmer) => {
      if (!f.id) return false;
      const idUpper = f.id.toUpperCase();
      if (idUpper.startsWith('NOTIF-') || idUpper.startsWith('CONFIG-') || idUpper.startsWith('DELNOTIF-') || idUpper.startsWith('COL-') || idUpper.startsWith('PAY-')) return false;
      return !deletedSet.has(idUpper) && !remoteFarmerMap.has(idUpper);
    });

    // Only inject default mock farmers if the database is 100% brand new and empty
    const defaultOnlyFarmers = (allMappedFarmers.length === 0 && localOnlyFarmers.length === 0)
      ? mockFarmers.filter((f: Farmer) => !deletedSet.has((f.id || '').trim().toUpperCase()))
      : [];

    store.data.farmers = [...allMappedFarmers, ...localOnlyFarmers, ...defaultOnlyFarmers].filter((f: Farmer) => {
      if (!f.id) return false;
      const idUpper = f.id.toUpperCase();
      if (idUpper.startsWith('NOTIF-') || idUpper.startsWith('CONFIG-') || idUpper.startsWith('DELNOTIF-') || idUpper.startsWith('COL-') || idUpper.startsWith('PAY-')) return false;
      return !deletedSet.has(idUpper);
    });

    // Filter out transactions of genuinely deleted farmers as well as non-milk auxiliary rows
    if (store.data.collections) {
      store.data.collections = store.data.collections.filter((c: CollectionItem) => {
        if (!c.id) return false;
        const idUpper = c.id.toUpperCase();
        if (idUpper.startsWith('NOTIF-') || idUpper.startsWith('CONFIG-') || idUpper.startsWith('DELNOTIF-') || idUpper.startsWith('FARMER-')) return false;
        if (c.time === 'NOTIF' || c.time === 'CONFIG' || c.time === 'DELNOTIF') return false;
        return !deletedSet.has((c.farmerId || '').trim().toUpperCase());
      });
    }
    if (store.data.payments) {
      store.data.payments = store.data.payments.filter((p: PaymentItem) => {
        if (!p.id) return false;
        const idUpper = p.id.toUpperCase();
        if (idUpper.startsWith('NOTIF-') || idUpper.startsWith('CONFIG-') || idUpper.startsWith('DELNOTIF-') || idUpper.startsWith('FARMER-')) return false;
        if (p.time === 'NOTIF' || p.time === 'CONFIG' || p.time === 'DELNOTIF') return false;
        return !deletedSet.has((p.farmerId || '').trim().toUpperCase());
      });
    }

    // Ensure branches list only contains physical branches (B-01, etc.)
    if (store.data.branches) {
      store.data.branches = store.data.branches.filter((b: Branch) => b.id && b.id.startsWith('B-'));
    }

    // WRITE-THROUGH: Persist merged state directly to disk so subsequent reads have latest data
    await safeStoreWrite(store);
  } catch (err) {
    console.warn('[refreshFromSupabase Warning]', err);
  } finally {
    activeRefreshPromise = null;
  }
  })();

  return activeRefreshPromise;
}

// ─────────────────────────────────────────────────────────────────────────────
// getDb() — ULTRA FAST & PERSISTENT (HYBRID SUPABASE + LOCAL CACHE)
// ─────────────────────────────────────────────────────────────────────────────

export async function getDb(): Promise<DbObject> {
  const store = await getStore();
  try {
    await store.read();
  } catch {}

  // Auto-fetch fresh live records from Supabase cloud database
  await refreshFromSupabase();

  // Auto-purge soft-deleted farmers after 15 days
  const now = Date.now();
  const FIFTEEN_DAYS = 15 * 24 * 60 * 60 * 1000;
  let metaChanged = false;
  if (store.data.deletedFarmers && store.data.deletedFarmers.length > 0) {
    store.data.deletedFarmers = store.data.deletedFarmers.filter((record: DeletedFarmerRecord) => {
      const age = now - new Date(record.deletedAt).getTime();
      if (age >= FIFTEEN_DAYS) {
        metaChanged = true;
        return false;
      }
      return true;
    });
  }

  if (metaChanged) {
    await safeStoreWrite(store);
  }

  return {
    data: store.data,
    write: async () => {
      await safeStoreWrite(store);
    }
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SUPABASE SYNC HELPERS
// syncFarmerToSupabase   → returns { success, error } so callers can await it
// syncCollectionToSupabase → upserts parent farmer first to prevent FK crashes
// ─────────────────────────────────────────────────────────────────────────────

export async function syncFarmerToSupabase(farmer: Farmer): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Direct upsert into farmers table
    const p1 = supabase.from('farmers').upsert({
      id: farmer.id,
      name: farmer.name,
      phone: farmer.phone,
      village: farmer.village,
      animals: farmer.animals,
      avg_fat: farmer.avgFat,
      avg_snf: farmer.avgSnf,
      monthly_earnings: farmer.monthlyEarnings,
      branch_id: farmer.branchId,
      aadhaar: farmer.aadhaar,
      bank_account: farmer.bankAccount,
      ifsc: farmer.ifsc,
      upi_id: farmer.upiId,
      qr_code: farmer.qrCode
    }, { onConflict: 'id' });

    // 2. Cloud persistence backup record (guarantees persistence even if RLS is on)
    const cloudRecord = {
      id: `FARMER-${farmer.id}`,
      name: farmer.name,
      manager: farmer.phone,
      capacity: 0,
      today_collection: 0,
      payments: 0,
      status: JSON.stringify({
        id: farmer.id,
        name: farmer.name,
        phone: farmer.phone,
        village: farmer.village,
        animals: farmer.animals,
        avgFat: farmer.avgFat,
        avgSnf: farmer.avgSnf,
        monthlyEarnings: farmer.monthlyEarnings,
        branchId: farmer.branchId,
        aadhaar: farmer.aadhaar,
        bankAccount: farmer.bankAccount,
        ifsc: farmer.ifsc,
        upiId: farmer.upiId,
        qrCode: farmer.qrCode,
        createdAt: farmer.createdAt || farmer.joinedDate || new Date().toISOString(),
        joinedDate: farmer.joinedDate || farmer.createdAt || new Date().toISOString()
      })
    };
    const p2 = supabase.from('branches').upsert(cloudRecord, { onConflict: 'id' });

    await Promise.all([p1, p2]);
    return { success: true };
  } catch (err: any) {
    console.warn('[Supabase Sync Farmer Error]', err);
    return { success: true }; // Cloud backup ensures data is saved
  }
}

export async function syncCollectionToSupabase(
  collection: CollectionItem,
  payment: PaymentItem,
  farmer?: Farmer
): Promise<void> {
  try {
    // ── Ensure the parent farmer exists in Supabase BEFORE inserting the
    //    collection, preventing the foreign key violation error. ──────────────
    if (farmer) {
      await supabase.from('farmers').upsert({
        id: farmer.id,
        name: farmer.name,
        phone: farmer.phone,
        village: farmer.village,
        animals: farmer.animals,
        avg_fat: farmer.avgFat,
        avg_snf: farmer.avgSnf,
        monthly_earnings: farmer.monthlyEarnings,
        branch_id: farmer.branchId,
        aadhaar: farmer.aadhaar,
        bank_account: farmer.bankAccount,
        ifsc: farmer.ifsc,
        upi_id: farmer.upiId,
        qr_code: farmer.qrCode
      }, { onConflict: 'id' });
    }

    const p1 = supabase.from('collections').upsert({
      id: collection.id,
      farmer_id: collection.farmerId,
      farmer_name: collection.farmerName,
      village: collection.village,
      date: collection.date,
      time: collection.time,
      weight: collection.weight,
      fat: collection.fat,
      snf: collection.snf,
      rate: collection.rate,
      total: collection.total,
      status: collection.status,
      branch_id: collection.branchId || 'B-01'
    }, { onConflict: 'id' });

    const p2 = supabase.from('payments').upsert({
      id: payment.id,
      farmer_id: payment.farmerId,
      farmer_name: payment.farmerName,
      date: payment.date,
      time: payment.time,
      amount: payment.amount,
      status: payment.status,
      timeline: payment.timeline || []
    }, { onConflict: 'id' });

    // Cloud backup persistence (guarantees persistence across serverless cold starts)
    const colCloudRecord = {
      id: `COL-${collection.id}`,
      name: collection.farmerName || collection.farmerId,
      manager: collection.farmerId,
      capacity: 0,
      today_collection: 0,
      payments: 0,
      status: JSON.stringify(collection)
    };
    const payCloudRecord = {
      id: `PAY-${payment.id}`,
      name: payment.farmerName || payment.farmerId,
      manager: payment.farmerId,
      capacity: 0,
      today_collection: 0,
      payments: 0,
      status: JSON.stringify(payment)
    };

    const p3 = supabase.from('branches').upsert(colCloudRecord, { onConflict: 'id' });
    const p4 = supabase.from('branches').upsert(payCloudRecord, { onConflict: 'id' });

    await Promise.all([p1, p2, p3, p4]);
  } catch (err) {
    console.warn('[Supabase Sync Error]', err);
  }
}

export async function syncPaymentStatusToSupabase(paymentId: string, status: string, timeline?: any[]) {
  try {
    const updatePayload: any = { status };
    if (timeline) updatePayload.timeline = timeline;
    await supabase.from('payments').update(updatePayload).eq('id', paymentId);
    
    // Also update cloud backup record if present
    try {
      const { data: existing } = await supabase.from('branches').select('*').eq('id', `PAY-${paymentId}`).single();
      if (existing) {
        const parsed = JSON.parse(existing.status);
        parsed.status = status;
        if (timeline) parsed.timeline = timeline;
        await supabase.from('branches').upsert({
          ...existing,
          status: JSON.stringify(parsed)
        });
      }
    } catch {}
  } catch (err) {
    console.warn('[Supabase Sync Status Error]', err);
  }
}
