export interface FormulaConfig {
  basePrice: number;
  fatFactor: number;
  snfFactor: number;
}

export const defaultFormulaConfig: FormulaConfig = {
  basePrice: 25,
  fatFactor: 3.5,
  snfFactor: 2.0
};

export function calculateRate(fat: number, snf: number, config: FormulaConfig): number {
  const rate = config.basePrice + fat * config.fatFactor + snf * config.snfFactor;
  return Math.round(rate * 100) / 100;
}

export const getLocalDateString = (): string => {
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return formatter.format(new Date()); // Formats as YYYY-MM-DD
  } catch {
    const d = new Date();
    const istMs = d.getTime() + (5.5 * 60 * 60 * 1000);
    const istD = new Date(istMs);
    const year = istD.getUTCFullYear();
    const month = String(istD.getUTCMonth() + 1).padStart(2, '0');
    const day = String(istD.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
};

export const getIndiaTimeString = (): string => {
  try {
    return new Date().toLocaleTimeString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    }).toUpperCase();
  } catch {
    return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }).toUpperCase();
  }
};

/** Format any time string to Indian Standard Time (IST) ensuring proper 12-hour AM/PM format */
export const formatToIndiaTime = (timeStr?: string): string => {
  if (!timeStr) return getIndiaTimeString();
  const trimmed = timeStr.trim();
  
  // If it's already an AM/PM time like 07:12 PM, return cleaned
  if (/\b(am|pm)\b/i.test(trimmed)) {
    return trimmed.toUpperCase();
  }
  
  // If it's 24-hour time like 19:12 or 14:12, convert to 12-hour AM/PM
  const match = trimmed.match(/^(\d{1,2}):(\d{2})/);
  if (match) {
    let hours = parseInt(match[1], 10);
    const mins = match[2];
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return `${String(hours).padStart(2, '0')}:${mins} ${ampm}`;
  }
  
  return trimmed;
};

/** Mask Aadhaar Number: XXXX-XXXX-1234 (only last 4 digits visible) */
export const maskAadhaar = (aadhaar?: string): string => {
  if (!aadhaar) return "XXXX-XXXX-XXXX";
  const digits = aadhaar.replace(/\D/g, "");
  if (digits.length < 4) return "XXXX-XXXX-XXXX";
  return `XXXX-XXXX-${digits.slice(-4)}`;
};

/** Mask Bank Account: ••••••••5678 (only last 4 digits visible) */
export const maskBankAccount = (account?: string): string => {
  if (!account) return "••••••••••••";
  const clean = account.replace(/\s+/g, "");
  if (clean.length < 4) return "••••••••••••";
  return `••••••••${clean.slice(-4)}`;
};

/** Mask IFSC Code: SBIN••••••• (only showing bank prefix) */
export const maskIfsc = (ifsc?: string): string => {
  if (!ifsc) return "•••••••••••";
  const clean = ifsc.replace(/\s+/g, "").toUpperCase();
  if (clean.length < 4) return "•••••••••••";
  return `${clean.slice(0, 4)}•••••••`;
};

export const getAutoShift = (): "Morning" | "Evening" => {
  try {
    const istHour = parseInt(
      new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        hour12: false
      }).format(new Date()),
      10
    );
    // Standard Indian Dairy Shift: Morning is 04:00 AM - 12:59 PM; Evening is 01:00 PM - 11:59 PM
    return istHour >= 13 ? "Evening" : "Morning";
  } catch {
    const hour = new Date().getHours();
    return hour >= 13 ? "Evening" : "Morning";
  }
};

/** Check if evening milk collection shift is currently open */
export const isEveningShiftOpen = (): boolean => true;

/** Determine whether a collection belongs to Morning or Evening shift */
export function getCollectionShift(col?: { time?: string; shift?: string } | null): "Morning" | "Evening" {
  if (!col) return "Morning";

  // 1. Explicit shift property takes highest priority
  if (col.shift) {
    const s = String(col.shift).trim().toLowerCase();
    if (s.includes("even")) return "Evening";
    if (s.includes("morn")) return "Morning";
  }

  // 2. Exact match in time property
  if (col.time) {
    const t = String(col.time).trim().toLowerCase();
    if (t === "evening" || t.startsWith("even")) return "Evening";
    if (t === "morning" || t.startsWith("morn")) return "Morning";

    // 3. If time is a 12-hour or 24-hour clock string (e.g. "06:30 PM", "11:20 AM", "14:15")
    const match = t.match(/^(\d{1,2}):(\d{2})\s*(am|pm)?/i);
    if (match) {
      let h = parseInt(match[1], 10);
      const ampm = (match[3] || '').toLowerCase();
      if (ampm === 'pm' && h < 12) h += 12;
      if (ampm === 'am' && h === 12) h = 0;
      // Hours 13 (1 PM) to 23 (11 PM) are Evening shift.
      // Hours 0 to 12 (up to 12:59 PM) are Morning shift.
      return h >= 13 ? "Evening" : "Morning";
    }
  }

  return "Morning";
}

/** Convert date string + time string into exact UNIX millisecond timestamp for chronological sorting */
export function parseDateTimeToEpoch(dateStr?: string, timeStr?: string, idStr?: string): number {
  if (!dateStr) return 0;
  const cleanDate = dateStr.split('T')[0];

  // 1. If explicit 12-hour AM/PM clock time is present (e.g. "03:55 PM", "11:21 AM")
  if (timeStr && (timeStr.toUpperCase().includes('AM') || timeStr.toUpperCase().includes('PM'))) {
    try {
      const parts = timeStr.trim().split(/\s+/);
      const timeParts = parts[0].split(':');
      let hours = parseInt(timeParts[0], 10);
      const minutes = parseInt(timeParts[1] || '0', 10);
      const seconds = parseInt(timeParts[2] || '0', 10);
      const isPM = parts[1]?.toUpperCase() === 'PM';
      if (isPM && hours < 12) hours += 12;
      if (!isPM && hours === 12) hours = 0;
      
      const d = new Date(`${cleanDate}T00:00:00`);
      d.setHours(hours, minutes, seconds, 0);
      return d.getTime();
    } catch {}
  }
  
  // 2. Legacy generic labels without exact clock time
  // Assigned early daytime offsets so ANY live timestamped transaction on the same day ranks higher (Newest First)
  if (timeStr && timeStr.toLowerCase().trim() === 'evening') {
    const d = new Date(`${cleanDate}T12:00:00`);
    return d.getTime();
  }
  if (timeStr && timeStr.toLowerCase().trim() === 'morning') {
    const d = new Date(`${cleanDate}T07:00:00`);
    return d.getTime();
  }

  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? 0 : d.getTime();
}

export interface MilkHistoryItem {
  date: string;
  volume: number;
  fat: number;
  snf: number;
  total: number;
}

export interface PaymentHistoryItem {
  date: string;
  amount: number;
  status: 'Success' | 'Processing' | 'Failed';
  transactionId: string;
}

export interface Farmer {
  id: string;
  name: string;
  village: string;
  phone: string;
  animals: number;
  avgFat: number;
  avgSnf: number;
  monthlyEarnings: number;
  qrCode: string;
  branchId: string;
  aadhaar: string;
  bankAccount: string;
  ifsc: string;
  upiId: string;
  createdAt?: string;
  joinedDate?: string;
  milkHistory: MilkHistoryItem[];
  paymentHistory: PaymentHistoryItem[];
}

export interface CollectionItem {
  id: string;
  farmerId: string;
  farmerName: string;
  village: string;
  date: string;
  time: 'Morning' | 'Evening' | string;
  shift?: 'Morning' | 'Evening' | string;
  weight: number;
  fat: number;
  snf: number;
  rate: number;
  total: number;
  status: 'Success' | 'Processing' | 'Failed';
  branchId: string;
}

export interface PaymentTimelineStep {
  label: string;
  status: 'completed' | 'current' | 'pending' | 'failed';
  time?: string;
  description: string;
}

export interface PaymentItem {
  id: string;
  farmerId: string;
  farmerName: string;
  date: string;
  time: string;
  amount: number;
  status: 'Success' | 'Processing' | 'Failed';
  timeline: PaymentTimelineStep[];
}

export interface Branch {
  id: string;
  name: string;
  manager: string;
  capacity: number;
  todayCollection: number;
  employees: number;
  payments: number;
  status: 'Active' | 'Maintenance';
  x: number;
  y: number;
}

// ----------------------------------------------------
// Restored Production Database Snapshot
// ----------------------------------------------------

export const mockFarmers: Farmer[] = [
  {
    "id": "F-105",
    "name": "Pritesh Ahire",
    "village": "Kolhapur, Maharashtra",
    "phone": "+91 7894561234",
    "animals": 4,
    "avgFat": 4.2,
    "avgSnf": 8.5,
    "monthlyEarnings": 58.6,
    "branchId": "B-01",
    "aadhaar": "111111115555",
    "bankAccount": "1233214560",
    "ifsc": "BIKS1236540",
    "upiId": "pritesh@upi",
    "qrCode": "3T-F-105-PRITESHAHIRE",
    "milkHistory": [
      {
        "date": "2026-08-03",
        "volume": 1,
        "fat": 4.2,
        "snf": 8.5,
        "total": 58.6
      },
      {
        "date": "2026-08-03",
        "volume": 1,
        "fat": 4.2,
        "snf": 8.5,
        "total": 58.6
      },
      {
        "date": "2026-08-03",
        "volume": 1,
        "fat": 4.2,
        "snf": 8.5,
        "total": 60.1
      }
    ],
    "paymentHistory": [
      {
        "date": "2026-08-03",
        "amount": 58.6,
        "status": "Success",
        "transactionId": "PAY-4955"
      },
      {
        "date": "2026-08-03",
        "amount": 58.6,
        "status": "Success",
        "transactionId": "PAY-7335"
      },
      {
        "date": "2026-08-03",
        "amount": 60.1,
        "status": "Success",
        "transactionId": "PAY-2226"
      }
    ]
  },
  {
    "id": "F-101",
    "name": "Aditya Chavan",
    "phone": "+91 7896541230",
    "village": "Kolhapur, Maharashtra",
    "animals": 5,
    "avgFat": 4.2,
    "avgSnf": 8.5,
    "aadhaar": "1111 1111 1111",
    "bankAccount": "1111 1111 1111",
    "ifsc": "SBIN1236547",
    "upiId": "name@upi",
    "qrCode": "3T-F-101-ADITYACHAVAN",
    "branchId": "B-01",
    "monthlyEarnings": 28160.18,
    "milkHistory": [
      {
        "date": "2026-08-04",
        "volume": 12.5,
        "fat": 4.2,
        "snf": 8.5,
        "total": 732.5
      },
      {
        "date": "2026-08-04",
        "volume": 20,
        "fat": 4.2,
        "snf": 8.5,
        "total": 1172
      },
      {
        "date": "2026-08-01",
        "volume": 12,
        "fat": 4.2,
        "snf": 8.5,
        "total": 271.8
      },
      {
        "date": "2026-08-01",
        "volume": 12,
        "fat": 4.2,
        "snf": 8.5,
        "total": 22.65
      },
      {
        "date": "2026-08-01",
        "volume": 12,
        "fat": 4.2,
        "snf": 8.5,
        "total": 447.6
      },
      {
        "date": "2026-07-30",
        "volume": 10,
        "fat": 3.5,
        "snf": 8.5,
        "total": 355.5
      },
      {
        "date": "2026-08-02",
        "volume": 0.5,
        "fat": 4.2,
        "snf": 8.5,
        "total": 53.85
      },
      {
        "date": "2026-08-01",
        "volume": 10,
        "fat": 4,
        "snf": 8.5,
        "total": 590
      },
      {
        "date": "2026-08-01",
        "volume": 8,
        "fat": 4.1,
        "snf": 8.5,
        "total": 476.4
      },
      {
        "date": "2026-07-31",
        "volume": 10.5,
        "fat": 4.1,
        "snf": 8.5,
        "total": 625.28
      },
      {
        "date": "2026-07-31",
        "volume": 8.5,
        "fat": 4.2,
        "snf": 8.5,
        "total": 510.85
      },
      {
        "date": "2026-07-30",
        "volume": 11,
        "fat": 4.2,
        "snf": 8.5,
        "total": 661.1
      },
      {
        "date": "2026-07-30",
        "volume": 8,
        "fat": 4.3,
        "snf": 8.5,
        "total": 485.2
      },
      {
        "date": "2026-07-29",
        "volume": 10,
        "fat": 4.3,
        "snf": 8.5,
        "total": 606.5
      },
      {
        "date": "2026-07-29",
        "volume": 8.5,
        "fat": 4.1,
        "snf": 8.5,
        "total": 506.17
      },
      {
        "date": "2026-07-28",
        "volume": 10.5,
        "fat": 4,
        "snf": 8.5,
        "total": 619.5
      },
      {
        "date": "2026-07-28",
        "volume": 8,
        "fat": 4.2,
        "snf": 8.5,
        "total": 480.8
      },
      {
        "date": "2026-07-27",
        "volume": 11,
        "fat": 4.1,
        "snf": 8.5,
        "total": 655.05
      },
      {
        "date": "2026-07-27",
        "volume": 8.5,
        "fat": 4.3,
        "snf": 8.5,
        "total": 515.53
      },
      {
        "date": "2026-07-26",
        "volume": 10,
        "fat": 4.2,
        "snf": 8.5,
        "total": 601
      },
      {
        "date": "2026-07-26",
        "volume": 8,
        "fat": 4.1,
        "snf": 8.5,
        "total": 476.4
      },
      {
        "date": "2026-07-25",
        "volume": 10.5,
        "fat": 4.3,
        "snf": 8.5,
        "total": 636.82
      },
      {
        "date": "2026-07-25",
        "volume": 8.5,
        "fat": 4.2,
        "snf": 8.5,
        "total": 510.85
      },
      {
        "date": "2026-07-24",
        "volume": 11,
        "fat": 4,
        "snf": 8.5,
        "total": 649
      },
      {
        "date": "2026-07-24",
        "volume": 8,
        "fat": 4.3,
        "snf": 8.5,
        "total": 485.2
      },
      {
        "date": "2026-07-23",
        "volume": 10,
        "fat": 4.1,
        "snf": 8.5,
        "total": 595.5
      },
      {
        "date": "2026-07-23",
        "volume": 8.5,
        "fat": 4.1,
        "snf": 8.5,
        "total": 506.17
      },
      {
        "date": "2026-07-22",
        "volume": 10.5,
        "fat": 4.2,
        "snf": 8.5,
        "total": 631.05
      },
      {
        "date": "2026-07-22",
        "volume": 8,
        "fat": 4.2,
        "snf": 8.5,
        "total": 480.8
      },
      {
        "date": "2026-07-21",
        "volume": 11,
        "fat": 4.3,
        "snf": 8.5,
        "total": 667.15
      },
      {
        "date": "2026-07-21",
        "volume": 8.5,
        "fat": 4.3,
        "snf": 8.5,
        "total": 515.53
      },
      {
        "date": "2026-07-20",
        "volume": 10,
        "fat": 4,
        "snf": 8.5,
        "total": 590
      },
      {
        "date": "2026-07-20",
        "volume": 8,
        "fat": 4.1,
        "snf": 8.5,
        "total": 476.4
      },
      {
        "date": "2026-07-19",
        "volume": 10.5,
        "fat": 4.1,
        "snf": 8.5,
        "total": 625.28
      },
      {
        "date": "2026-07-19",
        "volume": 8.5,
        "fat": 4.2,
        "snf": 8.5,
        "total": 510.85
      },
      {
        "date": "2026-07-18",
        "volume": 11,
        "fat": 4.2,
        "snf": 8.5,
        "total": 661.1
      },
      {
        "date": "2026-07-18",
        "volume": 8,
        "fat": 4.3,
        "snf": 8.5,
        "total": 485.2
      },
      {
        "date": "2026-07-17",
        "volume": 10,
        "fat": 4.3,
        "snf": 8.5,
        "total": 606.5
      },
      {
        "date": "2026-07-16",
        "volume": 10.5,
        "fat": 4,
        "snf": 8.5,
        "total": 619.5
      },
      {
        "date": "2026-07-15",
        "volume": 11,
        "fat": 4.1,
        "snf": 8.5,
        "total": 655.05
      },
      {
        "date": "2026-07-14",
        "volume": 10,
        "fat": 4.2,
        "snf": 8.5,
        "total": 601
      },
      {
        "date": "2026-07-13",
        "volume": 10.5,
        "fat": 4.3,
        "snf": 8.5,
        "total": 636.82
      },
      {
        "date": "2026-07-12",
        "volume": 11,
        "fat": 4,
        "snf": 8.5,
        "total": 649
      },
      {
        "date": "2026-07-11",
        "volume": 10,
        "fat": 4.1,
        "snf": 8.5,
        "total": 595.5
      },
      {
        "date": "2026-07-10",
        "volume": 10.5,
        "fat": 4.2,
        "snf": 8.5,
        "total": 631.05
      },
      {
        "date": "2026-07-09",
        "volume": 11,
        "fat": 4.3,
        "snf": 8.5,
        "total": 667.15
      },
      {
        "date": "2026-07-08",
        "volume": 10,
        "fat": 4,
        "snf": 8.5,
        "total": 590
      },
      {
        "date": "2026-07-07",
        "volume": 10.5,
        "fat": 4.1,
        "snf": 8.5,
        "total": 625.28
      },
      {
        "date": "2026-07-06",
        "volume": 11,
        "fat": 4.2,
        "snf": 8.5,
        "total": 661.1
      },
      {
        "date": "2026-07-05",
        "volume": 10,
        "fat": 4.3,
        "snf": 8.5,
        "total": 606.5
      },
      {
        "date": "2026-07-04",
        "volume": 10.5,
        "fat": 4,
        "snf": 8.5,
        "total": 619.5
      },
      {
        "date": "2026-07-03",
        "volume": 11,
        "fat": 4.1,
        "snf": 8.5,
        "total": 655.05
      }
    ],
    "paymentHistory": [
      {
        "date": "2026-08-04",
        "amount": 732.5,
        "status": "Success",
        "transactionId": "PAY-5330"
      },
      {
        "date": "2026-08-04",
        "amount": 1172,
        "status": "Success",
        "transactionId": "PAY-0698"
      },
      {
        "date": "2026-08-02",
        "amount": 53.85,
        "status": "Success",
        "transactionId": "PAY-9955"
      },
      {
        "date": "2026-07-30",
        "amount": 355.5,
        "status": "Success",
        "transactionId": "PAY-5105"
      },
      {
        "date": "2026-08-01",
        "amount": 447.6,
        "status": "Success",
        "transactionId": "PAY-2343"
      },
      {
        "date": "2026-08-01",
        "amount": 271.8,
        "status": "Success",
        "transactionId": "PAY-7511"
      },
      {
        "date": "2026-08-01",
        "amount": 22.65,
        "status": "Success",
        "transactionId": "PAY-0801"
      },
      {
        "date": "2026-08-02",
        "amount": 447.6,
        "status": "Success",
        "transactionId": "PAY-1011"
      },
      {
        "date": "2026-08-01",
        "amount": 590,
        "status": "Success",
        "transactionId": "PAY-1000"
      },
      {
        "date": "2026-08-01",
        "amount": 476.4,
        "status": "Success",
        "transactionId": "PAY-5000"
      },
      {
        "date": "2026-07-31",
        "amount": 625.28,
        "status": "Success",
        "transactionId": "PAY-1010"
      },
      {
        "date": "2026-07-31",
        "amount": 510.85,
        "status": "Success",
        "transactionId": "PAY-5010"
      },
      {
        "date": "2026-07-30",
        "amount": 661.1,
        "status": "Success",
        "transactionId": "PAY-1020"
      },
      {
        "date": "2026-07-30",
        "amount": 485.2,
        "status": "Success",
        "transactionId": "PAY-5020"
      },
      {
        "date": "2026-07-29",
        "amount": 606.5,
        "status": "Success",
        "transactionId": "PAY-1030"
      },
      {
        "date": "2026-07-29",
        "amount": 506.17,
        "status": "Success",
        "transactionId": "PAY-5030"
      },
      {
        "date": "2026-07-28",
        "amount": 619.5,
        "status": "Success",
        "transactionId": "PAY-1040"
      },
      {
        "date": "2026-07-28",
        "amount": 480.8,
        "status": "Success",
        "transactionId": "PAY-5040"
      },
      {
        "date": "2026-07-27",
        "amount": 655.05,
        "status": "Success",
        "transactionId": "PAY-1050"
      },
      {
        "date": "2026-07-27",
        "amount": 515.53,
        "status": "Success",
        "transactionId": "PAY-5050"
      },
      {
        "date": "2026-07-26",
        "amount": 601,
        "status": "Success",
        "transactionId": "PAY-1060"
      },
      {
        "date": "2026-07-26",
        "amount": 476.4,
        "status": "Success",
        "transactionId": "PAY-5060"
      },
      {
        "date": "2026-07-25",
        "amount": 636.82,
        "status": "Success",
        "transactionId": "PAY-1070"
      },
      {
        "date": "2026-07-25",
        "amount": 510.85,
        "status": "Success",
        "transactionId": "PAY-5070"
      },
      {
        "date": "2026-07-24",
        "amount": 649,
        "status": "Success",
        "transactionId": "PAY-1080"
      },
      {
        "date": "2026-07-24",
        "amount": 485.2,
        "status": "Success",
        "transactionId": "PAY-5080"
      },
      {
        "date": "2026-07-23",
        "amount": 595.5,
        "status": "Success",
        "transactionId": "PAY-1090"
      },
      {
        "date": "2026-07-23",
        "amount": 506.17,
        "status": "Success",
        "transactionId": "PAY-5090"
      },
      {
        "date": "2026-07-22",
        "amount": 631.05,
        "status": "Success",
        "transactionId": "PAY-1100"
      },
      {
        "date": "2026-07-22",
        "amount": 480.8,
        "status": "Success",
        "transactionId": "PAY-5100"
      },
      {
        "date": "2026-07-21",
        "amount": 667.15,
        "status": "Success",
        "transactionId": "PAY-1110"
      },
      {
        "date": "2026-07-21",
        "amount": 515.53,
        "status": "Success",
        "transactionId": "PAY-5110"
      },
      {
        "date": "2026-07-20",
        "amount": 590,
        "status": "Success",
        "transactionId": "PAY-1120"
      },
      {
        "date": "2026-07-20",
        "amount": 476.4,
        "status": "Success",
        "transactionId": "PAY-5120"
      },
      {
        "date": "2026-07-19",
        "amount": 625.28,
        "status": "Success",
        "transactionId": "PAY-1130"
      },
      {
        "date": "2026-07-19",
        "amount": 510.85,
        "status": "Success",
        "transactionId": "PAY-5130"
      },
      {
        "date": "2026-07-18",
        "amount": 661.1,
        "status": "Success",
        "transactionId": "PAY-1140"
      },
      {
        "date": "2026-07-18",
        "amount": 485.2,
        "status": "Success",
        "transactionId": "PAY-5140"
      },
      {
        "date": "2026-07-17",
        "amount": 606.5,
        "status": "Success",
        "transactionId": "PAY-1150"
      },
      {
        "date": "2026-07-16",
        "amount": 619.5,
        "status": "Success",
        "transactionId": "PAY-1160"
      },
      {
        "date": "2026-07-15",
        "amount": 655.05,
        "status": "Success",
        "transactionId": "PAY-1170"
      },
      {
        "date": "2026-07-14",
        "amount": 601,
        "status": "Success",
        "transactionId": "PAY-1180"
      },
      {
        "date": "2026-07-13",
        "amount": 636.82,
        "status": "Success",
        "transactionId": "PAY-1190"
      },
      {
        "date": "2026-07-12",
        "amount": 649,
        "status": "Success",
        "transactionId": "PAY-1200"
      },
      {
        "date": "2026-07-11",
        "amount": 595.5,
        "status": "Success",
        "transactionId": "PAY-1210"
      },
      {
        "date": "2026-07-10",
        "amount": 631.05,
        "status": "Success",
        "transactionId": "PAY-1220"
      },
      {
        "date": "2026-07-09",
        "amount": 667.15,
        "status": "Success",
        "transactionId": "PAY-1230"
      },
      {
        "date": "2026-07-08",
        "amount": 590,
        "status": "Success",
        "transactionId": "PAY-1240"
      },
      {
        "date": "2026-07-07",
        "amount": 625.28,
        "status": "Success",
        "transactionId": "PAY-1250"
      },
      {
        "date": "2026-07-06",
        "amount": 661.1,
        "status": "Success",
        "transactionId": "PAY-1260"
      },
      {
        "date": "2026-07-05",
        "amount": 606.5,
        "status": "Success",
        "transactionId": "PAY-1270"
      },
      {
        "date": "2026-07-04",
        "amount": 619.5,
        "status": "Success",
        "transactionId": "PAY-1280"
      },
      {
        "date": "2026-07-03",
        "amount": 655.05,
        "status": "Success",
        "transactionId": "PAY-1290"
      }
    ]
  },
  {
    "id": "F-102",
    "name": "Sandesh Kadam",
    "phone": "+91 7896541231",
    "village": "Kolhapur, Maharashtra",
    "animals": 5,
    "avgFat": 4.2,
    "avgSnf": 8.5,
    "aadhaar": "1111 1111 2222",
    "bankAccount": "1345678978998",
    "ifsc": "BIKS5252525",
    "upiId": "name@upi",
    "qrCode": "3T-F-102-SANDESHKADAM",
    "branchId": "B-01",
    "monthlyEarnings": 31195.25,
    "milkHistory": [
      {
        "date": "2026-08-01",
        "volume": 12,
        "fat": 4,
        "snf": 8.5,
        "total": 708
      },
      {
        "date": "2026-08-01",
        "volume": 9.5,
        "fat": 4.1,
        "snf": 8.5,
        "total": 565.73
      },
      {
        "date": "2026-07-31",
        "volume": 12.5,
        "fat": 4.1,
        "snf": 8.5,
        "total": 744.38
      },
      {
        "date": "2026-07-31",
        "volume": 10,
        "fat": 4.2,
        "snf": 8.5,
        "total": 601
      },
      {
        "date": "2026-07-30",
        "volume": 13,
        "fat": 4.2,
        "snf": 8.5,
        "total": 781.3
      },
      {
        "date": "2026-07-30",
        "volume": 9.5,
        "fat": 4.3,
        "snf": 8.5,
        "total": 576.17
      },
      {
        "date": "2026-07-29",
        "volume": 12,
        "fat": 4.3,
        "snf": 8.5,
        "total": 727.8
      },
      {
        "date": "2026-07-29",
        "volume": 10,
        "fat": 4.1,
        "snf": 8.5,
        "total": 595.5
      },
      {
        "date": "2026-07-28",
        "volume": 12.5,
        "fat": 4,
        "snf": 8.5,
        "total": 737.5
      },
      {
        "date": "2026-07-28",
        "volume": 9.5,
        "fat": 4.2,
        "snf": 8.5,
        "total": 570.95
      },
      {
        "date": "2026-07-27",
        "volume": 13,
        "fat": 4.1,
        "snf": 8.5,
        "total": 774.15
      },
      {
        "date": "2026-07-27",
        "volume": 10,
        "fat": 4.3,
        "snf": 8.5,
        "total": 606.5
      },
      {
        "date": "2026-07-26",
        "volume": 12,
        "fat": 4.2,
        "snf": 8.5,
        "total": 721.2
      },
      {
        "date": "2026-07-26",
        "volume": 9.5,
        "fat": 4.1,
        "snf": 8.5,
        "total": 565.73
      },
      {
        "date": "2026-07-25",
        "volume": 12.5,
        "fat": 4.3,
        "snf": 8.5,
        "total": 758.13
      },
      {
        "date": "2026-07-25",
        "volume": 10,
        "fat": 4.2,
        "snf": 8.5,
        "total": 601
      },
      {
        "date": "2026-07-24",
        "volume": 13,
        "fat": 4,
        "snf": 8.5,
        "total": 767
      },
      {
        "date": "2026-07-24",
        "volume": 9.5,
        "fat": 4.3,
        "snf": 8.5,
        "total": 576.17
      },
      {
        "date": "2026-07-23",
        "volume": 12,
        "fat": 4.1,
        "snf": 8.5,
        "total": 714.6
      },
      {
        "date": "2026-07-23",
        "volume": 10,
        "fat": 4.1,
        "snf": 8.5,
        "total": 595.5
      },
      {
        "date": "2026-07-22",
        "volume": 12.5,
        "fat": 4.2,
        "snf": 8.5,
        "total": 751.25
      },
      {
        "date": "2026-07-22",
        "volume": 9.5,
        "fat": 4.2,
        "snf": 8.5,
        "total": 570.95
      },
      {
        "date": "2026-07-21",
        "volume": 13,
        "fat": 4.3,
        "snf": 8.5,
        "total": 788.45
      },
      {
        "date": "2026-07-21",
        "volume": 10,
        "fat": 4.3,
        "snf": 8.5,
        "total": 606.5
      },
      {
        "date": "2026-07-20",
        "volume": 12,
        "fat": 4,
        "snf": 8.5,
        "total": 708
      },
      {
        "date": "2026-07-20",
        "volume": 9.5,
        "fat": 4.1,
        "snf": 8.5,
        "total": 565.73
      },
      {
        "date": "2026-07-19",
        "volume": 12.5,
        "fat": 4.1,
        "snf": 8.5,
        "total": 744.38
      },
      {
        "date": "2026-07-19",
        "volume": 10,
        "fat": 4.2,
        "snf": 8.5,
        "total": 601
      },
      {
        "date": "2026-07-18",
        "volume": 13,
        "fat": 4.2,
        "snf": 8.5,
        "total": 781.3
      },
      {
        "date": "2026-07-18",
        "volume": 9.5,
        "fat": 4.3,
        "snf": 8.5,
        "total": 576.17
      },
      {
        "date": "2026-07-17",
        "volume": 12,
        "fat": 4.3,
        "snf": 8.5,
        "total": 727.8
      },
      {
        "date": "2026-07-16",
        "volume": 12.5,
        "fat": 4,
        "snf": 8.5,
        "total": 737.5
      },
      {
        "date": "2026-07-15",
        "volume": 13,
        "fat": 4.1,
        "snf": 8.5,
        "total": 774.15
      },
      {
        "date": "2026-07-14",
        "volume": 12,
        "fat": 4.2,
        "snf": 8.5,
        "total": 721.2
      },
      {
        "date": "2026-07-13",
        "volume": 12.5,
        "fat": 4.3,
        "snf": 8.5,
        "total": 758.13
      },
      {
        "date": "2026-07-12",
        "volume": 13,
        "fat": 4,
        "snf": 8.5,
        "total": 767
      },
      {
        "date": "2026-07-11",
        "volume": 12,
        "fat": 4.1,
        "snf": 8.5,
        "total": 714.6
      },
      {
        "date": "2026-07-10",
        "volume": 12.5,
        "fat": 4.2,
        "snf": 8.5,
        "total": 751.25
      },
      {
        "date": "2026-07-09",
        "volume": 13,
        "fat": 4.3,
        "snf": 8.5,
        "total": 788.45
      },
      {
        "date": "2026-07-08",
        "volume": 12,
        "fat": 4,
        "snf": 8.5,
        "total": 708
      },
      {
        "date": "2026-07-07",
        "volume": 12.5,
        "fat": 4.1,
        "snf": 8.5,
        "total": 744.38
      },
      {
        "date": "2026-07-06",
        "volume": 13,
        "fat": 4.2,
        "snf": 8.5,
        "total": 781.3
      },
      {
        "date": "2026-07-05",
        "volume": 12,
        "fat": 4.3,
        "snf": 8.5,
        "total": 727.8
      },
      {
        "date": "2026-07-04",
        "volume": 12.5,
        "fat": 4,
        "snf": 8.5,
        "total": 737.5
      },
      {
        "date": "2026-07-03",
        "volume": 13,
        "fat": 4.1,
        "snf": 8.5,
        "total": 774.15
      }
    ],
    "paymentHistory": [
      {
        "date": "2026-08-02",
        "amount": 559.5,
        "status": "Success",
        "transactionId": "PAY-1021"
      },
      {
        "date": "2026-08-01",
        "amount": 708,
        "status": "Success",
        "transactionId": "PAY-1002"
      },
      {
        "date": "2026-08-01",
        "amount": 565.73,
        "status": "Success",
        "transactionId": "PAY-5002"
      },
      {
        "date": "2026-07-31",
        "amount": 744.38,
        "status": "Success",
        "transactionId": "PAY-1012"
      },
      {
        "date": "2026-07-31",
        "amount": 601,
        "status": "Success",
        "transactionId": "PAY-5012"
      },
      {
        "date": "2026-07-30",
        "amount": 781.3,
        "status": "Success",
        "transactionId": "PAY-1022"
      },
      {
        "date": "2026-07-30",
        "amount": 576.17,
        "status": "Success",
        "transactionId": "PAY-5022"
      },
      {
        "date": "2026-07-29",
        "amount": 727.8,
        "status": "Success",
        "transactionId": "PAY-1032"
      },
      {
        "date": "2026-07-29",
        "amount": 595.5,
        "status": "Success",
        "transactionId": "PAY-5032"
      },
      {
        "date": "2026-07-28",
        "amount": 737.5,
        "status": "Success",
        "transactionId": "PAY-1042"
      },
      {
        "date": "2026-07-28",
        "amount": 570.95,
        "status": "Success",
        "transactionId": "PAY-5042"
      },
      {
        "date": "2026-07-27",
        "amount": 774.15,
        "status": "Success",
        "transactionId": "PAY-1052"
      },
      {
        "date": "2026-07-27",
        "amount": 606.5,
        "status": "Success",
        "transactionId": "PAY-5052"
      },
      {
        "date": "2026-07-26",
        "amount": 721.2,
        "status": "Success",
        "transactionId": "PAY-1062"
      },
      {
        "date": "2026-07-26",
        "amount": 565.73,
        "status": "Success",
        "transactionId": "PAY-5062"
      },
      {
        "date": "2026-07-25",
        "amount": 758.13,
        "status": "Success",
        "transactionId": "PAY-1072"
      },
      {
        "date": "2026-07-25",
        "amount": 601,
        "status": "Success",
        "transactionId": "PAY-5072"
      },
      {
        "date": "2026-07-24",
        "amount": 767,
        "status": "Success",
        "transactionId": "PAY-1082"
      },
      {
        "date": "2026-07-24",
        "amount": 576.17,
        "status": "Success",
        "transactionId": "PAY-5082"
      },
      {
        "date": "2026-07-23",
        "amount": 714.6,
        "status": "Success",
        "transactionId": "PAY-1092"
      },
      {
        "date": "2026-07-23",
        "amount": 595.5,
        "status": "Success",
        "transactionId": "PAY-5092"
      },
      {
        "date": "2026-07-22",
        "amount": 751.25,
        "status": "Success",
        "transactionId": "PAY-1102"
      },
      {
        "date": "2026-07-22",
        "amount": 570.95,
        "status": "Success",
        "transactionId": "PAY-5102"
      },
      {
        "date": "2026-07-21",
        "amount": 788.45,
        "status": "Success",
        "transactionId": "PAY-1112"
      },
      {
        "date": "2026-07-21",
        "amount": 606.5,
        "status": "Success",
        "transactionId": "PAY-5112"
      },
      {
        "date": "2026-07-20",
        "amount": 708,
        "status": "Success",
        "transactionId": "PAY-1122"
      },
      {
        "date": "2026-07-20",
        "amount": 565.73,
        "status": "Success",
        "transactionId": "PAY-5122"
      },
      {
        "date": "2026-07-19",
        "amount": 744.38,
        "status": "Success",
        "transactionId": "PAY-1132"
      },
      {
        "date": "2026-07-19",
        "amount": 601,
        "status": "Success",
        "transactionId": "PAY-5132"
      },
      {
        "date": "2026-07-18",
        "amount": 781.3,
        "status": "Success",
        "transactionId": "PAY-1142"
      },
      {
        "date": "2026-07-18",
        "amount": 576.17,
        "status": "Success",
        "transactionId": "PAY-5142"
      },
      {
        "date": "2026-07-17",
        "amount": 727.8,
        "status": "Success",
        "transactionId": "PAY-1152"
      },
      {
        "date": "2026-07-16",
        "amount": 737.5,
        "status": "Success",
        "transactionId": "PAY-1162"
      },
      {
        "date": "2026-07-15",
        "amount": 774.15,
        "status": "Success",
        "transactionId": "PAY-1172"
      },
      {
        "date": "2026-07-14",
        "amount": 721.2,
        "status": "Success",
        "transactionId": "PAY-1182"
      },
      {
        "date": "2026-07-13",
        "amount": 758.13,
        "status": "Success",
        "transactionId": "PAY-1192"
      },
      {
        "date": "2026-07-12",
        "amount": 767,
        "status": "Success",
        "transactionId": "PAY-1202"
      },
      {
        "date": "2026-07-11",
        "amount": 714.6,
        "status": "Success",
        "transactionId": "PAY-1212"
      },
      {
        "date": "2026-07-10",
        "amount": 751.25,
        "status": "Success",
        "transactionId": "PAY-1222"
      },
      {
        "date": "2026-07-09",
        "amount": 788.45,
        "status": "Success",
        "transactionId": "PAY-1232"
      },
      {
        "date": "2026-07-08",
        "amount": 708,
        "status": "Success",
        "transactionId": "PAY-1242"
      },
      {
        "date": "2026-07-07",
        "amount": 744.38,
        "status": "Success",
        "transactionId": "PAY-1252"
      },
      {
        "date": "2026-07-06",
        "amount": 781.3,
        "status": "Success",
        "transactionId": "PAY-1262"
      },
      {
        "date": "2026-07-05",
        "amount": 727.8,
        "status": "Success",
        "transactionId": "PAY-1272"
      },
      {
        "date": "2026-07-04",
        "amount": 737.5,
        "status": "Success",
        "transactionId": "PAY-1282"
      },
      {
        "date": "2026-07-03",
        "amount": 774.15,
        "status": "Success",
        "transactionId": "PAY-1292"
      }
    ]
  },
  {
    "id": "F-103",
    "name": "Mahesh Yadav",
    "phone": "+91 7896541232",
    "village": "Kolhapur, Maharashtra",
    "animals": 2,
    "avgFat": 4.1,
    "avgSnf": 8.4,
    "aadhaar": "1111 1111 3333",
    "bankAccount": "7441258963",
    "ifsc": "BIN32145698",
    "upiId": "Mahesh@upi",
    "qrCode": "3T-F-103-MAHESHYADAV",
    "branchId": "B-01",
    "monthlyEarnings": 37184.79,
    "milkHistory": [
      {
        "date": "2026-08-02",
        "volume": 12,
        "fat": 2.5,
        "snf": 5,
        "total": 525
      },
      {
        "date": "2026-08-02",
        "volume": 12,
        "fat": 2.5,
        "snf": 5,
        "total": 525
      },
      {
        "date": "2026-08-01",
        "volume": 14,
        "fat": 4,
        "snf": 8.5,
        "total": 826
      },
      {
        "date": "2026-08-01",
        "volume": 11,
        "fat": 4.1,
        "snf": 8.5,
        "total": 655.05
      },
      {
        "date": "2026-07-31",
        "volume": 14.5,
        "fat": 4.1,
        "snf": 8.5,
        "total": 863.47
      },
      {
        "date": "2026-07-31",
        "volume": 11.5,
        "fat": 4.2,
        "snf": 8.5,
        "total": 691.15
      },
      {
        "date": "2026-07-30",
        "volume": 15,
        "fat": 4.2,
        "snf": 8.5,
        "total": 901.5
      },
      {
        "date": "2026-07-30",
        "volume": 11,
        "fat": 4.3,
        "snf": 8.5,
        "total": 667.15
      },
      {
        "date": "2026-07-29",
        "volume": 14,
        "fat": 4.3,
        "snf": 8.5,
        "total": 849.1
      },
      {
        "date": "2026-07-29",
        "volume": 11.5,
        "fat": 4.1,
        "snf": 8.5,
        "total": 684.83
      },
      {
        "date": "2026-07-28",
        "volume": 14.5,
        "fat": 4,
        "snf": 8.5,
        "total": 855.5
      },
      {
        "date": "2026-07-28",
        "volume": 11,
        "fat": 4.2,
        "snf": 8.5,
        "total": 661.1
      },
      {
        "date": "2026-07-27",
        "volume": 15,
        "fat": 4.1,
        "snf": 8.5,
        "total": 893.25
      },
      {
        "date": "2026-07-27",
        "volume": 11.5,
        "fat": 4.3,
        "snf": 8.5,
        "total": 697.48
      },
      {
        "date": "2026-07-26",
        "volume": 14,
        "fat": 4.2,
        "snf": 8.5,
        "total": 841.4
      },
      {
        "date": "2026-07-26",
        "volume": 11,
        "fat": 4.1,
        "snf": 8.5,
        "total": 655.05
      },
      {
        "date": "2026-07-25",
        "volume": 14.5,
        "fat": 4.3,
        "snf": 8.5,
        "total": 879.43
      },
      {
        "date": "2026-07-25",
        "volume": 11.5,
        "fat": 4.2,
        "snf": 8.5,
        "total": 691.15
      },
      {
        "date": "2026-07-24",
        "volume": 15,
        "fat": 4,
        "snf": 8.5,
        "total": 885
      },
      {
        "date": "2026-07-24",
        "volume": 11,
        "fat": 4.3,
        "snf": 8.5,
        "total": 667.15
      },
      {
        "date": "2026-07-23",
        "volume": 14,
        "fat": 4.1,
        "snf": 8.5,
        "total": 833.7
      },
      {
        "date": "2026-07-23",
        "volume": 11.5,
        "fat": 4.1,
        "snf": 8.5,
        "total": 684.83
      },
      {
        "date": "2026-07-22",
        "volume": 14.5,
        "fat": 4.2,
        "snf": 8.5,
        "total": 871.45
      },
      {
        "date": "2026-07-22",
        "volume": 11,
        "fat": 4.2,
        "snf": 8.5,
        "total": 661.1
      },
      {
        "date": "2026-07-21",
        "volume": 15,
        "fat": 4.3,
        "snf": 8.5,
        "total": 909.75
      },
      {
        "date": "2026-07-21",
        "volume": 11.5,
        "fat": 4.3,
        "snf": 8.5,
        "total": 697.48
      },
      {
        "date": "2026-07-20",
        "volume": 14,
        "fat": 4,
        "snf": 8.5,
        "total": 826
      },
      {
        "date": "2026-07-20",
        "volume": 11,
        "fat": 4.1,
        "snf": 8.5,
        "total": 655.05
      },
      {
        "date": "2026-07-19",
        "volume": 14.5,
        "fat": 4.1,
        "snf": 8.5,
        "total": 863.47
      },
      {
        "date": "2026-07-19",
        "volume": 11.5,
        "fat": 4.2,
        "snf": 8.5,
        "total": 691.15
      },
      {
        "date": "2026-07-18",
        "volume": 15,
        "fat": 4.2,
        "snf": 8.5,
        "total": 901.5
      },
      {
        "date": "2026-07-18",
        "volume": 11,
        "fat": 4.3,
        "snf": 8.5,
        "total": 667.15
      },
      {
        "date": "2026-07-17",
        "volume": 14,
        "fat": 4.3,
        "snf": 8.5,
        "total": 849.1
      },
      {
        "date": "2026-07-16",
        "volume": 14.5,
        "fat": 4,
        "snf": 8.5,
        "total": 855.5
      },
      {
        "date": "2026-07-15",
        "volume": 15,
        "fat": 4.1,
        "snf": 8.5,
        "total": 893.25
      },
      {
        "date": "2026-07-14",
        "volume": 14,
        "fat": 4.2,
        "snf": 8.5,
        "total": 841.4
      },
      {
        "date": "2026-07-13",
        "volume": 14.5,
        "fat": 4.3,
        "snf": 8.5,
        "total": 879.43
      },
      {
        "date": "2026-07-12",
        "volume": 15,
        "fat": 4,
        "snf": 8.5,
        "total": 885
      },
      {
        "date": "2026-07-11",
        "volume": 14,
        "fat": 4.1,
        "snf": 8.5,
        "total": 833.7
      },
      {
        "date": "2026-07-10",
        "volume": 14.5,
        "fat": 4.2,
        "snf": 8.5,
        "total": 871.45
      },
      {
        "date": "2026-07-09",
        "volume": 15,
        "fat": 4.3,
        "snf": 8.5,
        "total": 909.75
      },
      {
        "date": "2026-07-08",
        "volume": 14,
        "fat": 4,
        "snf": 8.5,
        "total": 826
      },
      {
        "date": "2026-07-07",
        "volume": 14.5,
        "fat": 4.1,
        "snf": 8.5,
        "total": 863.47
      },
      {
        "date": "2026-07-06",
        "volume": 15,
        "fat": 4.2,
        "snf": 8.5,
        "total": 901.5
      },
      {
        "date": "2026-07-05",
        "volume": 14,
        "fat": 4.3,
        "snf": 8.5,
        "total": 849.1
      },
      {
        "date": "2026-07-04",
        "volume": 14.5,
        "fat": 4,
        "snf": 8.5,
        "total": 855.5
      },
      {
        "date": "2026-07-03",
        "volume": 15,
        "fat": 4.1,
        "snf": 8.5,
        "total": 893.25
      }
    ],
    "paymentHistory": [
      {
        "date": "2026-08-02",
        "amount": 525,
        "status": "Success",
        "transactionId": "PAY-6235"
      },
      {
        "date": "2026-08-02",
        "amount": 525,
        "status": "Success",
        "transactionId": "PAY-9825"
      },
      {
        "date": "2026-08-01",
        "amount": 447.6,
        "status": "Success",
        "transactionId": "PAY-1031"
      },
      {
        "date": "2026-08-01",
        "amount": 826,
        "status": "Success",
        "transactionId": "PAY-1004"
      },
      {
        "date": "2026-08-01",
        "amount": 655.05,
        "status": "Success",
        "transactionId": "PAY-5004"
      },
      {
        "date": "2026-07-31",
        "amount": 863.47,
        "status": "Success",
        "transactionId": "PAY-1014"
      },
      {
        "date": "2026-07-31",
        "amount": 691.15,
        "status": "Success",
        "transactionId": "PAY-5014"
      },
      {
        "date": "2026-07-30",
        "amount": 901.5,
        "status": "Success",
        "transactionId": "PAY-1024"
      },
      {
        "date": "2026-07-30",
        "amount": 667.15,
        "status": "Success",
        "transactionId": "PAY-5024"
      },
      {
        "date": "2026-07-29",
        "amount": 849.1,
        "status": "Success",
        "transactionId": "PAY-1034"
      },
      {
        "date": "2026-07-29",
        "amount": 684.83,
        "status": "Success",
        "transactionId": "PAY-5034"
      },
      {
        "date": "2026-07-28",
        "amount": 855.5,
        "status": "Success",
        "transactionId": "PAY-1044"
      },
      {
        "date": "2026-07-28",
        "amount": 661.1,
        "status": "Success",
        "transactionId": "PAY-5044"
      },
      {
        "date": "2026-07-27",
        "amount": 893.25,
        "status": "Success",
        "transactionId": "PAY-1054"
      },
      {
        "date": "2026-07-27",
        "amount": 697.48,
        "status": "Success",
        "transactionId": "PAY-5054"
      },
      {
        "date": "2026-07-26",
        "amount": 841.4,
        "status": "Success",
        "transactionId": "PAY-1064"
      },
      {
        "date": "2026-07-26",
        "amount": 655.05,
        "status": "Success",
        "transactionId": "PAY-5064"
      },
      {
        "date": "2026-07-25",
        "amount": 879.43,
        "status": "Success",
        "transactionId": "PAY-1074"
      },
      {
        "date": "2026-07-25",
        "amount": 691.15,
        "status": "Success",
        "transactionId": "PAY-5074"
      },
      {
        "date": "2026-07-24",
        "amount": 885,
        "status": "Success",
        "transactionId": "PAY-1084"
      },
      {
        "date": "2026-07-24",
        "amount": 667.15,
        "status": "Success",
        "transactionId": "PAY-5084"
      },
      {
        "date": "2026-07-23",
        "amount": 833.7,
        "status": "Success",
        "transactionId": "PAY-1094"
      },
      {
        "date": "2026-07-23",
        "amount": 684.83,
        "status": "Success",
        "transactionId": "PAY-5094"
      },
      {
        "date": "2026-07-22",
        "amount": 871.45,
        "status": "Success",
        "transactionId": "PAY-1104"
      },
      {
        "date": "2026-07-22",
        "amount": 661.1,
        "status": "Success",
        "transactionId": "PAY-5104"
      },
      {
        "date": "2026-07-21",
        "amount": 909.75,
        "status": "Success",
        "transactionId": "PAY-1114"
      },
      {
        "date": "2026-07-21",
        "amount": 697.48,
        "status": "Success",
        "transactionId": "PAY-5114"
      },
      {
        "date": "2026-07-20",
        "amount": 826,
        "status": "Success",
        "transactionId": "PAY-1124"
      },
      {
        "date": "2026-07-20",
        "amount": 655.05,
        "status": "Success",
        "transactionId": "PAY-5124"
      },
      {
        "date": "2026-07-19",
        "amount": 863.47,
        "status": "Success",
        "transactionId": "PAY-1134"
      },
      {
        "date": "2026-07-19",
        "amount": 691.15,
        "status": "Success",
        "transactionId": "PAY-5134"
      },
      {
        "date": "2026-07-18",
        "amount": 901.5,
        "status": "Success",
        "transactionId": "PAY-1144"
      },
      {
        "date": "2026-07-18",
        "amount": 667.15,
        "status": "Success",
        "transactionId": "PAY-5144"
      },
      {
        "date": "2026-07-17",
        "amount": 849.1,
        "status": "Success",
        "transactionId": "PAY-1154"
      },
      {
        "date": "2026-07-16",
        "amount": 855.5,
        "status": "Success",
        "transactionId": "PAY-1164"
      },
      {
        "date": "2026-07-15",
        "amount": 893.25,
        "status": "Success",
        "transactionId": "PAY-1174"
      },
      {
        "date": "2026-07-14",
        "amount": 841.4,
        "status": "Success",
        "transactionId": "PAY-1184"
      },
      {
        "date": "2026-07-13",
        "amount": 879.43,
        "status": "Success",
        "transactionId": "PAY-1194"
      },
      {
        "date": "2026-07-12",
        "amount": 885,
        "status": "Success",
        "transactionId": "PAY-1204"
      },
      {
        "date": "2026-07-11",
        "amount": 833.7,
        "status": "Success",
        "transactionId": "PAY-1214"
      },
      {
        "date": "2026-07-10",
        "amount": 871.45,
        "status": "Success",
        "transactionId": "PAY-1224"
      },
      {
        "date": "2026-07-09",
        "amount": 909.75,
        "status": "Success",
        "transactionId": "PAY-1234"
      },
      {
        "date": "2026-07-08",
        "amount": 826,
        "status": "Success",
        "transactionId": "PAY-1244"
      },
      {
        "date": "2026-07-07",
        "amount": 863.47,
        "status": "Success",
        "transactionId": "PAY-1254"
      },
      {
        "date": "2026-07-06",
        "amount": 901.5,
        "status": "Success",
        "transactionId": "PAY-1264"
      },
      {
        "date": "2026-07-05",
        "amount": 849.1,
        "status": "Success",
        "transactionId": "PAY-1274"
      },
      {
        "date": "2026-07-04",
        "amount": 855.5,
        "status": "Success",
        "transactionId": "PAY-1284"
      },
      {
        "date": "2026-07-03",
        "amount": 893.25,
        "status": "Success",
        "transactionId": "PAY-1294"
      }
    ]
  },
  {
    "id": "F-104",
    "name": "Om Rudnure",
    "phone": "+91 7896541233",
    "village": "Kolhapur, Maharashtra",
    "animals": 5,
    "avgFat": 4.3,
    "avgSnf": 7.3,
    "monthlyEarnings": 1389,
    "branchId": "B-01",
    "aadhaar": "1111 1111 4444",
    "bankAccount": "7411478520",
    "ifsc": "BIKS7896540",
    "upiId": "om@upi",
    "qrCode": "3T-F-104-OMRUDNURE",
    "milkHistory": [
      {
        "date": "2026-08-02",
        "volume": 12,
        "fat": 6,
        "snf": 9.5,
        "total": 864
      },
      {
        "date": "2026-08-02",
        "volume": 12,
        "fat": 2.5,
        "snf": 5,
        "total": 525
      }
    ],
    "paymentHistory": [
      {
        "date": "2026-08-02",
        "amount": 864,
        "status": "Success",
        "transactionId": "PAY-0673"
      },
      {
        "date": "2026-08-02",
        "amount": 525,
        "status": "Success",
        "transactionId": "PAY-3201"
      }
    ]
  }
];

export const mockCollections: CollectionItem[] = [
  {
    "id": "C-5330",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-08-04",
    "time": "Morning",
    "weight": 12.5,
    "fat": 4.2,
    "snf": 8.5,
    "rate": 58.6,
    "total": 732.5,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "C-0698",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-08-04",
    "time": "Evening",
    "weight": 20,
    "fat": 4.2,
    "snf": 8.5,
    "rate": 58.6,
    "total": 1172,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "C-4955",
    "farmerId": "F-105",
    "farmerName": "Pritesh Ahire",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-08-03",
    "time": "Morning",
    "weight": 1,
    "fat": 4.2,
    "snf": 8.5,
    "rate": 58.6,
    "total": 58.6,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "C-7335",
    "farmerId": "F-105",
    "farmerName": "Pritesh Ahire",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-08-03",
    "time": "Morning",
    "weight": 1,
    "fat": 4.2,
    "snf": 8.5,
    "rate": 58.6,
    "total": 58.6,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "C-2226",
    "farmerId": "F-105",
    "farmerName": "Pritesh Ahire",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-08-03",
    "time": "Morning",
    "weight": 1,
    "fat": 4.2,
    "snf": 8.5,
    "rate": 60.1,
    "total": 60.1,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "C-0673",
    "farmerId": "F-104",
    "farmerName": "Om Rudnure",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-08-02",
    "time": "Evening",
    "weight": 12,
    "fat": 6,
    "snf": 9.5,
    "rate": 72,
    "total": 864,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "C-3201",
    "farmerId": "F-104",
    "farmerName": "Om Rudnure",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-08-02",
    "time": "Evening",
    "weight": 12,
    "fat": 2.5,
    "snf": 5,
    "rate": 43.75,
    "total": 525,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "C-6235",
    "farmerId": "F-103",
    "farmerName": "Mahesh Yadav",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-08-02",
    "time": "Evening",
    "weight": 12,
    "fat": 2.5,
    "snf": 5,
    "rate": 43.75,
    "total": 525,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "C-9824",
    "farmerId": "F-103",
    "farmerName": "Mahesh Yadav",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-08-02",
    "time": "Evening",
    "weight": 12,
    "fat": 2.5,
    "snf": 5,
    "rate": 43.75,
    "total": 525,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-7511",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-08-01",
    "time": "01:25 am",
    "weight": 12,
    "fat": 4.2,
    "snf": 8.5,
    "rate": 22.65,
    "total": 271.8,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-0801",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-08-01",
    "time": "01:24 am",
    "weight": 12,
    "fat": 4.2,
    "snf": 8.5,
    "rate": 1.89,
    "total": 22.65,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-2343",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-08-01",
    "time": "01:03 am",
    "weight": 12,
    "fat": 4.2,
    "snf": 8.5,
    "rate": 37.3,
    "total": 447.6,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-5105",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-30",
    "time": "10:26 am",
    "weight": 10,
    "fat": 3.5,
    "snf": 8.5,
    "rate": 35.55,
    "total": 355.5,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-9955",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-08-02",
    "time": "10:10 am",
    "weight": 0.5,
    "fat": 4.2,
    "snf": 8.5,
    "rate": 107.7,
    "total": 53.85,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-1000",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-08-01",
    "time": "Morning",
    "weight": 10,
    "fat": 4,
    "snf": 8.5,
    "rate": 59,
    "total": 590,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-5000",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-08-01",
    "time": "Evening",
    "weight": 8,
    "fat": 4.1,
    "snf": 8.5,
    "rate": 59.55,
    "total": 476.4,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-1002",
    "farmerId": "F-102",
    "farmerName": "Sandesh Kadam",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-08-01",
    "time": "Morning",
    "weight": 12,
    "fat": 4,
    "snf": 8.5,
    "rate": 59,
    "total": 708,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-5002",
    "farmerId": "F-102",
    "farmerName": "Sandesh Kadam",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-08-01",
    "time": "Evening",
    "weight": 9.5,
    "fat": 4.1,
    "snf": 8.5,
    "rate": 59.55,
    "total": 565.73,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-1004",
    "farmerId": "F-103",
    "farmerName": "Mahesh Yadav",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-08-01",
    "time": "Morning",
    "weight": 14,
    "fat": 4,
    "snf": 8.5,
    "rate": 59,
    "total": 826,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-5004",
    "farmerId": "F-103",
    "farmerName": "Mahesh Yadav",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-08-01",
    "time": "Evening",
    "weight": 11,
    "fat": 4.1,
    "snf": 8.5,
    "rate": 59.55,
    "total": 655.05,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-1010",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-31",
    "time": "Morning",
    "weight": 10.5,
    "fat": 4.1,
    "snf": 8.5,
    "rate": 59.55,
    "total": 625.28,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-5010",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-31",
    "time": "Evening",
    "weight": 8.5,
    "fat": 4.2,
    "snf": 8.5,
    "rate": 60.1,
    "total": 510.85,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-1012",
    "farmerId": "F-102",
    "farmerName": "Sandesh Kadam",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-31",
    "time": "Morning",
    "weight": 12.5,
    "fat": 4.1,
    "snf": 8.5,
    "rate": 59.55,
    "total": 744.38,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-5012",
    "farmerId": "F-102",
    "farmerName": "Sandesh Kadam",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-31",
    "time": "Evening",
    "weight": 10,
    "fat": 4.2,
    "snf": 8.5,
    "rate": 60.1,
    "total": 601,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-1014",
    "farmerId": "F-103",
    "farmerName": "Mahesh Yadav",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-31",
    "time": "Morning",
    "weight": 14.5,
    "fat": 4.1,
    "snf": 8.5,
    "rate": 59.55,
    "total": 863.47,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-5014",
    "farmerId": "F-103",
    "farmerName": "Mahesh Yadav",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-31",
    "time": "Evening",
    "weight": 11.5,
    "fat": 4.2,
    "snf": 8.5,
    "rate": 60.1,
    "total": 691.15,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-1020",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-30",
    "time": "Morning",
    "weight": 11,
    "fat": 4.2,
    "snf": 8.5,
    "rate": 60.1,
    "total": 661.1,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-5020",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-30",
    "time": "Evening",
    "weight": 8,
    "fat": 4.3,
    "snf": 8.5,
    "rate": 60.65,
    "total": 485.2,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-1022",
    "farmerId": "F-102",
    "farmerName": "Sandesh Kadam",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-30",
    "time": "Morning",
    "weight": 13,
    "fat": 4.2,
    "snf": 8.5,
    "rate": 60.1,
    "total": 781.3,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-5022",
    "farmerId": "F-102",
    "farmerName": "Sandesh Kadam",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-30",
    "time": "Evening",
    "weight": 9.5,
    "fat": 4.3,
    "snf": 8.5,
    "rate": 60.65,
    "total": 576.17,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-1024",
    "farmerId": "F-103",
    "farmerName": "Mahesh Yadav",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-30",
    "time": "Morning",
    "weight": 15,
    "fat": 4.2,
    "snf": 8.5,
    "rate": 60.1,
    "total": 901.5,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-5024",
    "farmerId": "F-103",
    "farmerName": "Mahesh Yadav",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-30",
    "time": "Evening",
    "weight": 11,
    "fat": 4.3,
    "snf": 8.5,
    "rate": 60.65,
    "total": 667.15,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-1030",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-29",
    "time": "Morning",
    "weight": 10,
    "fat": 4.3,
    "snf": 8.5,
    "rate": 60.65,
    "total": 606.5,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-5030",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-29",
    "time": "Evening",
    "weight": 8.5,
    "fat": 4.1,
    "snf": 8.5,
    "rate": 59.55,
    "total": 506.17,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-1032",
    "farmerId": "F-102",
    "farmerName": "Sandesh Kadam",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-29",
    "time": "Morning",
    "weight": 12,
    "fat": 4.3,
    "snf": 8.5,
    "rate": 60.65,
    "total": 727.8,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-5032",
    "farmerId": "F-102",
    "farmerName": "Sandesh Kadam",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-29",
    "time": "Evening",
    "weight": 10,
    "fat": 4.1,
    "snf": 8.5,
    "rate": 59.55,
    "total": 595.5,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-1034",
    "farmerId": "F-103",
    "farmerName": "Mahesh Yadav",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-29",
    "time": "Morning",
    "weight": 14,
    "fat": 4.3,
    "snf": 8.5,
    "rate": 60.65,
    "total": 849.1,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-5034",
    "farmerId": "F-103",
    "farmerName": "Mahesh Yadav",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-29",
    "time": "Evening",
    "weight": 11.5,
    "fat": 4.1,
    "snf": 8.5,
    "rate": 59.55,
    "total": 684.83,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-1040",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-28",
    "time": "Morning",
    "weight": 10.5,
    "fat": 4,
    "snf": 8.5,
    "rate": 59,
    "total": 619.5,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-5040",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-28",
    "time": "Evening",
    "weight": 8,
    "fat": 4.2,
    "snf": 8.5,
    "rate": 60.1,
    "total": 480.8,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-1042",
    "farmerId": "F-102",
    "farmerName": "Sandesh Kadam",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-28",
    "time": "Morning",
    "weight": 12.5,
    "fat": 4,
    "snf": 8.5,
    "rate": 59,
    "total": 737.5,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-5042",
    "farmerId": "F-102",
    "farmerName": "Sandesh Kadam",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-28",
    "time": "Evening",
    "weight": 9.5,
    "fat": 4.2,
    "snf": 8.5,
    "rate": 60.1,
    "total": 570.95,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-1044",
    "farmerId": "F-103",
    "farmerName": "Mahesh Yadav",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-28",
    "time": "Morning",
    "weight": 14.5,
    "fat": 4,
    "snf": 8.5,
    "rate": 59,
    "total": 855.5,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-5044",
    "farmerId": "F-103",
    "farmerName": "Mahesh Yadav",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-28",
    "time": "Evening",
    "weight": 11,
    "fat": 4.2,
    "snf": 8.5,
    "rate": 60.1,
    "total": 661.1,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-1050",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-27",
    "time": "Morning",
    "weight": 11,
    "fat": 4.1,
    "snf": 8.5,
    "rate": 59.55,
    "total": 655.05,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-5050",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-27",
    "time": "Evening",
    "weight": 8.5,
    "fat": 4.3,
    "snf": 8.5,
    "rate": 60.65,
    "total": 515.53,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-1052",
    "farmerId": "F-102",
    "farmerName": "Sandesh Kadam",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-27",
    "time": "Morning",
    "weight": 13,
    "fat": 4.1,
    "snf": 8.5,
    "rate": 59.55,
    "total": 774.15,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-5052",
    "farmerId": "F-102",
    "farmerName": "Sandesh Kadam",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-27",
    "time": "Evening",
    "weight": 10,
    "fat": 4.3,
    "snf": 8.5,
    "rate": 60.65,
    "total": 606.5,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-1054",
    "farmerId": "F-103",
    "farmerName": "Mahesh Yadav",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-27",
    "time": "Morning",
    "weight": 15,
    "fat": 4.1,
    "snf": 8.5,
    "rate": 59.55,
    "total": 893.25,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-5054",
    "farmerId": "F-103",
    "farmerName": "Mahesh Yadav",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-27",
    "time": "Evening",
    "weight": 11.5,
    "fat": 4.3,
    "snf": 8.5,
    "rate": 60.65,
    "total": 697.48,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-1060",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-26",
    "time": "Morning",
    "weight": 10,
    "fat": 4.2,
    "snf": 8.5,
    "rate": 60.1,
    "total": 601,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-5060",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-26",
    "time": "Evening",
    "weight": 8,
    "fat": 4.1,
    "snf": 8.5,
    "rate": 59.55,
    "total": 476.4,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-1062",
    "farmerId": "F-102",
    "farmerName": "Sandesh Kadam",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-26",
    "time": "Morning",
    "weight": 12,
    "fat": 4.2,
    "snf": 8.5,
    "rate": 60.1,
    "total": 721.2,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-5062",
    "farmerId": "F-102",
    "farmerName": "Sandesh Kadam",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-26",
    "time": "Evening",
    "weight": 9.5,
    "fat": 4.1,
    "snf": 8.5,
    "rate": 59.55,
    "total": 565.73,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-1064",
    "farmerId": "F-103",
    "farmerName": "Mahesh Yadav",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-26",
    "time": "Morning",
    "weight": 14,
    "fat": 4.2,
    "snf": 8.5,
    "rate": 60.1,
    "total": 841.4,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-5064",
    "farmerId": "F-103",
    "farmerName": "Mahesh Yadav",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-26",
    "time": "Evening",
    "weight": 11,
    "fat": 4.1,
    "snf": 8.5,
    "rate": 59.55,
    "total": 655.05,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-1070",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-25",
    "time": "Morning",
    "weight": 10.5,
    "fat": 4.3,
    "snf": 8.5,
    "rate": 60.65,
    "total": 636.82,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-5070",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-25",
    "time": "Evening",
    "weight": 8.5,
    "fat": 4.2,
    "snf": 8.5,
    "rate": 60.1,
    "total": 510.85,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-1072",
    "farmerId": "F-102",
    "farmerName": "Sandesh Kadam",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-25",
    "time": "Morning",
    "weight": 12.5,
    "fat": 4.3,
    "snf": 8.5,
    "rate": 60.65,
    "total": 758.13,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-5072",
    "farmerId": "F-102",
    "farmerName": "Sandesh Kadam",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-25",
    "time": "Evening",
    "weight": 10,
    "fat": 4.2,
    "snf": 8.5,
    "rate": 60.1,
    "total": 601,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-1074",
    "farmerId": "F-103",
    "farmerName": "Mahesh Yadav",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-25",
    "time": "Morning",
    "weight": 14.5,
    "fat": 4.3,
    "snf": 8.5,
    "rate": 60.65,
    "total": 879.43,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-5074",
    "farmerId": "F-103",
    "farmerName": "Mahesh Yadav",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-25",
    "time": "Evening",
    "weight": 11.5,
    "fat": 4.2,
    "snf": 8.5,
    "rate": 60.1,
    "total": 691.15,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-1080",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-24",
    "time": "Morning",
    "weight": 11,
    "fat": 4,
    "snf": 8.5,
    "rate": 59,
    "total": 649,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-5080",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-24",
    "time": "Evening",
    "weight": 8,
    "fat": 4.3,
    "snf": 8.5,
    "rate": 60.65,
    "total": 485.2,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-1082",
    "farmerId": "F-102",
    "farmerName": "Sandesh Kadam",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-24",
    "time": "Morning",
    "weight": 13,
    "fat": 4,
    "snf": 8.5,
    "rate": 59,
    "total": 767,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-5082",
    "farmerId": "F-102",
    "farmerName": "Sandesh Kadam",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-24",
    "time": "Evening",
    "weight": 9.5,
    "fat": 4.3,
    "snf": 8.5,
    "rate": 60.65,
    "total": 576.17,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-1084",
    "farmerId": "F-103",
    "farmerName": "Mahesh Yadav",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-24",
    "time": "Morning",
    "weight": 15,
    "fat": 4,
    "snf": 8.5,
    "rate": 59,
    "total": 885,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-5084",
    "farmerId": "F-103",
    "farmerName": "Mahesh Yadav",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-24",
    "time": "Evening",
    "weight": 11,
    "fat": 4.3,
    "snf": 8.5,
    "rate": 60.65,
    "total": 667.15,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-1090",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-23",
    "time": "Morning",
    "weight": 10,
    "fat": 4.1,
    "snf": 8.5,
    "rate": 59.55,
    "total": 595.5,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-5090",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-23",
    "time": "Evening",
    "weight": 8.5,
    "fat": 4.1,
    "snf": 8.5,
    "rate": 59.55,
    "total": 506.17,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-1092",
    "farmerId": "F-102",
    "farmerName": "Sandesh Kadam",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-23",
    "time": "Morning",
    "weight": 12,
    "fat": 4.1,
    "snf": 8.5,
    "rate": 59.55,
    "total": 714.6,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-5092",
    "farmerId": "F-102",
    "farmerName": "Sandesh Kadam",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-23",
    "time": "Evening",
    "weight": 10,
    "fat": 4.1,
    "snf": 8.5,
    "rate": 59.55,
    "total": 595.5,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-1094",
    "farmerId": "F-103",
    "farmerName": "Mahesh Yadav",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-23",
    "time": "Morning",
    "weight": 14,
    "fat": 4.1,
    "snf": 8.5,
    "rate": 59.55,
    "total": 833.7,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-5094",
    "farmerId": "F-103",
    "farmerName": "Mahesh Yadav",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-23",
    "time": "Evening",
    "weight": 11.5,
    "fat": 4.1,
    "snf": 8.5,
    "rate": 59.55,
    "total": 684.83,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-1100",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-22",
    "time": "Morning",
    "weight": 10.5,
    "fat": 4.2,
    "snf": 8.5,
    "rate": 60.1,
    "total": 631.05,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-5100",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-22",
    "time": "Evening",
    "weight": 8,
    "fat": 4.2,
    "snf": 8.5,
    "rate": 60.1,
    "total": 480.8,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-1102",
    "farmerId": "F-102",
    "farmerName": "Sandesh Kadam",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-22",
    "time": "Morning",
    "weight": 12.5,
    "fat": 4.2,
    "snf": 8.5,
    "rate": 60.1,
    "total": 751.25,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-5102",
    "farmerId": "F-102",
    "farmerName": "Sandesh Kadam",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-22",
    "time": "Evening",
    "weight": 9.5,
    "fat": 4.2,
    "snf": 8.5,
    "rate": 60.1,
    "total": 570.95,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-1104",
    "farmerId": "F-103",
    "farmerName": "Mahesh Yadav",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-22",
    "time": "Morning",
    "weight": 14.5,
    "fat": 4.2,
    "snf": 8.5,
    "rate": 60.1,
    "total": 871.45,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-5104",
    "farmerId": "F-103",
    "farmerName": "Mahesh Yadav",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-22",
    "time": "Evening",
    "weight": 11,
    "fat": 4.2,
    "snf": 8.5,
    "rate": 60.1,
    "total": 661.1,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-1110",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-21",
    "time": "Morning",
    "weight": 11,
    "fat": 4.3,
    "snf": 8.5,
    "rate": 60.65,
    "total": 667.15,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-5110",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-21",
    "time": "Evening",
    "weight": 8.5,
    "fat": 4.3,
    "snf": 8.5,
    "rate": 60.65,
    "total": 515.53,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-1112",
    "farmerId": "F-102",
    "farmerName": "Sandesh Kadam",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-21",
    "time": "Morning",
    "weight": 13,
    "fat": 4.3,
    "snf": 8.5,
    "rate": 60.65,
    "total": 788.45,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-5112",
    "farmerId": "F-102",
    "farmerName": "Sandesh Kadam",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-21",
    "time": "Evening",
    "weight": 10,
    "fat": 4.3,
    "snf": 8.5,
    "rate": 60.65,
    "total": 606.5,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-1114",
    "farmerId": "F-103",
    "farmerName": "Mahesh Yadav",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-21",
    "time": "Morning",
    "weight": 15,
    "fat": 4.3,
    "snf": 8.5,
    "rate": 60.65,
    "total": 909.75,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-5114",
    "farmerId": "F-103",
    "farmerName": "Mahesh Yadav",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-21",
    "time": "Evening",
    "weight": 11.5,
    "fat": 4.3,
    "snf": 8.5,
    "rate": 60.65,
    "total": 697.48,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-1120",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-20",
    "time": "Morning",
    "weight": 10,
    "fat": 4,
    "snf": 8.5,
    "rate": 59,
    "total": 590,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-5120",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-20",
    "time": "Evening",
    "weight": 8,
    "fat": 4.1,
    "snf": 8.5,
    "rate": 59.55,
    "total": 476.4,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-1122",
    "farmerId": "F-102",
    "farmerName": "Sandesh Kadam",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-20",
    "time": "Morning",
    "weight": 12,
    "fat": 4,
    "snf": 8.5,
    "rate": 59,
    "total": 708,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-5122",
    "farmerId": "F-102",
    "farmerName": "Sandesh Kadam",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-20",
    "time": "Evening",
    "weight": 9.5,
    "fat": 4.1,
    "snf": 8.5,
    "rate": 59.55,
    "total": 565.73,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-1124",
    "farmerId": "F-103",
    "farmerName": "Mahesh Yadav",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-20",
    "time": "Morning",
    "weight": 14,
    "fat": 4,
    "snf": 8.5,
    "rate": 59,
    "total": 826,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-5124",
    "farmerId": "F-103",
    "farmerName": "Mahesh Yadav",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-20",
    "time": "Evening",
    "weight": 11,
    "fat": 4.1,
    "snf": 8.5,
    "rate": 59.55,
    "total": 655.05,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-1130",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-19",
    "time": "Morning",
    "weight": 10.5,
    "fat": 4.1,
    "snf": 8.5,
    "rate": 59.55,
    "total": 625.28,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-5130",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-19",
    "time": "Evening",
    "weight": 8.5,
    "fat": 4.2,
    "snf": 8.5,
    "rate": 60.1,
    "total": 510.85,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-1132",
    "farmerId": "F-102",
    "farmerName": "Sandesh Kadam",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-19",
    "time": "Morning",
    "weight": 12.5,
    "fat": 4.1,
    "snf": 8.5,
    "rate": 59.55,
    "total": 744.38,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-5132",
    "farmerId": "F-102",
    "farmerName": "Sandesh Kadam",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-19",
    "time": "Evening",
    "weight": 10,
    "fat": 4.2,
    "snf": 8.5,
    "rate": 60.1,
    "total": 601,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-1134",
    "farmerId": "F-103",
    "farmerName": "Mahesh Yadav",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-19",
    "time": "Morning",
    "weight": 14.5,
    "fat": 4.1,
    "snf": 8.5,
    "rate": 59.55,
    "total": 863.47,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-5134",
    "farmerId": "F-103",
    "farmerName": "Mahesh Yadav",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-19",
    "time": "Evening",
    "weight": 11.5,
    "fat": 4.2,
    "snf": 8.5,
    "rate": 60.1,
    "total": 691.15,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-1140",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-18",
    "time": "Morning",
    "weight": 11,
    "fat": 4.2,
    "snf": 8.5,
    "rate": 60.1,
    "total": 661.1,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-5140",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-18",
    "time": "Evening",
    "weight": 8,
    "fat": 4.3,
    "snf": 8.5,
    "rate": 60.65,
    "total": 485.2,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-1142",
    "farmerId": "F-102",
    "farmerName": "Sandesh Kadam",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-18",
    "time": "Morning",
    "weight": 13,
    "fat": 4.2,
    "snf": 8.5,
    "rate": 60.1,
    "total": 781.3,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-5142",
    "farmerId": "F-102",
    "farmerName": "Sandesh Kadam",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-18",
    "time": "Evening",
    "weight": 9.5,
    "fat": 4.3,
    "snf": 8.5,
    "rate": 60.65,
    "total": 576.17,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-1144",
    "farmerId": "F-103",
    "farmerName": "Mahesh Yadav",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-18",
    "time": "Morning",
    "weight": 15,
    "fat": 4.2,
    "snf": 8.5,
    "rate": 60.1,
    "total": 901.5,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-5144",
    "farmerId": "F-103",
    "farmerName": "Mahesh Yadav",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-18",
    "time": "Evening",
    "weight": 11,
    "fat": 4.3,
    "snf": 8.5,
    "rate": 60.65,
    "total": 667.15,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-1150",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-17",
    "time": "Morning",
    "weight": 10,
    "fat": 4.3,
    "snf": 8.5,
    "rate": 60.65,
    "total": 606.5,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-1152",
    "farmerId": "F-102",
    "farmerName": "Sandesh Kadam",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-17",
    "time": "Morning",
    "weight": 12,
    "fat": 4.3,
    "snf": 8.5,
    "rate": 60.65,
    "total": 727.8,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-1154",
    "farmerId": "F-103",
    "farmerName": "Mahesh Yadav",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-17",
    "time": "Morning",
    "weight": 14,
    "fat": 4.3,
    "snf": 8.5,
    "rate": 60.65,
    "total": 849.1,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-1160",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-16",
    "time": "Morning",
    "weight": 10.5,
    "fat": 4,
    "snf": 8.5,
    "rate": 59,
    "total": 619.5,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-1162",
    "farmerId": "F-102",
    "farmerName": "Sandesh Kadam",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-16",
    "time": "Morning",
    "weight": 12.5,
    "fat": 4,
    "snf": 8.5,
    "rate": 59,
    "total": 737.5,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-1164",
    "farmerId": "F-103",
    "farmerName": "Mahesh Yadav",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-16",
    "time": "Morning",
    "weight": 14.5,
    "fat": 4,
    "snf": 8.5,
    "rate": 59,
    "total": 855.5,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-1170",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-15",
    "time": "Morning",
    "weight": 11,
    "fat": 4.1,
    "snf": 8.5,
    "rate": 59.55,
    "total": 655.05,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-1172",
    "farmerId": "F-102",
    "farmerName": "Sandesh Kadam",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-15",
    "time": "Morning",
    "weight": 13,
    "fat": 4.1,
    "snf": 8.5,
    "rate": 59.55,
    "total": 774.15,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-1174",
    "farmerId": "F-103",
    "farmerName": "Mahesh Yadav",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-15",
    "time": "Morning",
    "weight": 15,
    "fat": 4.1,
    "snf": 8.5,
    "rate": 59.55,
    "total": 893.25,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-1180",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-14",
    "time": "Morning",
    "weight": 10,
    "fat": 4.2,
    "snf": 8.5,
    "rate": 60.1,
    "total": 601,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-1182",
    "farmerId": "F-102",
    "farmerName": "Sandesh Kadam",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-14",
    "time": "Morning",
    "weight": 12,
    "fat": 4.2,
    "snf": 8.5,
    "rate": 60.1,
    "total": 721.2,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-1184",
    "farmerId": "F-103",
    "farmerName": "Mahesh Yadav",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-14",
    "time": "Morning",
    "weight": 14,
    "fat": 4.2,
    "snf": 8.5,
    "rate": 60.1,
    "total": 841.4,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-1190",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-13",
    "time": "Morning",
    "weight": 10.5,
    "fat": 4.3,
    "snf": 8.5,
    "rate": 60.65,
    "total": 636.82,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-1192",
    "farmerId": "F-102",
    "farmerName": "Sandesh Kadam",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-13",
    "time": "Morning",
    "weight": 12.5,
    "fat": 4.3,
    "snf": 8.5,
    "rate": 60.65,
    "total": 758.13,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-1194",
    "farmerId": "F-103",
    "farmerName": "Mahesh Yadav",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-13",
    "time": "Morning",
    "weight": 14.5,
    "fat": 4.3,
    "snf": 8.5,
    "rate": 60.65,
    "total": 879.43,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-1200",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-12",
    "time": "Morning",
    "weight": 11,
    "fat": 4,
    "snf": 8.5,
    "rate": 59,
    "total": 649,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-1202",
    "farmerId": "F-102",
    "farmerName": "Sandesh Kadam",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-12",
    "time": "Morning",
    "weight": 13,
    "fat": 4,
    "snf": 8.5,
    "rate": 59,
    "total": 767,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-1204",
    "farmerId": "F-103",
    "farmerName": "Mahesh Yadav",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-12",
    "time": "Morning",
    "weight": 15,
    "fat": 4,
    "snf": 8.5,
    "rate": 59,
    "total": 885,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-1210",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-11",
    "time": "Morning",
    "weight": 10,
    "fat": 4.1,
    "snf": 8.5,
    "rate": 59.55,
    "total": 595.5,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-1212",
    "farmerId": "F-102",
    "farmerName": "Sandesh Kadam",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-11",
    "time": "Morning",
    "weight": 12,
    "fat": 4.1,
    "snf": 8.5,
    "rate": 59.55,
    "total": 714.6,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-1214",
    "farmerId": "F-103",
    "farmerName": "Mahesh Yadav",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-11",
    "time": "Morning",
    "weight": 14,
    "fat": 4.1,
    "snf": 8.5,
    "rate": 59.55,
    "total": 833.7,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-1220",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-10",
    "time": "Morning",
    "weight": 10.5,
    "fat": 4.2,
    "snf": 8.5,
    "rate": 60.1,
    "total": 631.05,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-1222",
    "farmerId": "F-102",
    "farmerName": "Sandesh Kadam",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-10",
    "time": "Morning",
    "weight": 12.5,
    "fat": 4.2,
    "snf": 8.5,
    "rate": 60.1,
    "total": 751.25,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-1224",
    "farmerId": "F-103",
    "farmerName": "Mahesh Yadav",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-10",
    "time": "Morning",
    "weight": 14.5,
    "fat": 4.2,
    "snf": 8.5,
    "rate": 60.1,
    "total": 871.45,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-1230",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-09",
    "time": "Morning",
    "weight": 11,
    "fat": 4.3,
    "snf": 8.5,
    "rate": 60.65,
    "total": 667.15,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-1232",
    "farmerId": "F-102",
    "farmerName": "Sandesh Kadam",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-09",
    "time": "Morning",
    "weight": 13,
    "fat": 4.3,
    "snf": 8.5,
    "rate": 60.65,
    "total": 788.45,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-1234",
    "farmerId": "F-103",
    "farmerName": "Mahesh Yadav",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-09",
    "time": "Morning",
    "weight": 15,
    "fat": 4.3,
    "snf": 8.5,
    "rate": 60.65,
    "total": 909.75,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-1240",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-08",
    "time": "Morning",
    "weight": 10,
    "fat": 4,
    "snf": 8.5,
    "rate": 59,
    "total": 590,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-1242",
    "farmerId": "F-102",
    "farmerName": "Sandesh Kadam",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-08",
    "time": "Morning",
    "weight": 12,
    "fat": 4,
    "snf": 8.5,
    "rate": 59,
    "total": 708,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-1244",
    "farmerId": "F-103",
    "farmerName": "Mahesh Yadav",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-08",
    "time": "Morning",
    "weight": 14,
    "fat": 4,
    "snf": 8.5,
    "rate": 59,
    "total": 826,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-1250",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-07",
    "time": "Morning",
    "weight": 10.5,
    "fat": 4.1,
    "snf": 8.5,
    "rate": 59.55,
    "total": 625.28,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-1252",
    "farmerId": "F-102",
    "farmerName": "Sandesh Kadam",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-07",
    "time": "Morning",
    "weight": 12.5,
    "fat": 4.1,
    "snf": 8.5,
    "rate": 59.55,
    "total": 744.38,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-1254",
    "farmerId": "F-103",
    "farmerName": "Mahesh Yadav",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-07",
    "time": "Morning",
    "weight": 14.5,
    "fat": 4.1,
    "snf": 8.5,
    "rate": 59.55,
    "total": 863.47,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-1260",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-06",
    "time": "Morning",
    "weight": 11,
    "fat": 4.2,
    "snf": 8.5,
    "rate": 60.1,
    "total": 661.1,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-1262",
    "farmerId": "F-102",
    "farmerName": "Sandesh Kadam",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-06",
    "time": "Morning",
    "weight": 13,
    "fat": 4.2,
    "snf": 8.5,
    "rate": 60.1,
    "total": 781.3,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-1264",
    "farmerId": "F-103",
    "farmerName": "Mahesh Yadav",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-06",
    "time": "Morning",
    "weight": 15,
    "fat": 4.2,
    "snf": 8.5,
    "rate": 60.1,
    "total": 901.5,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-1270",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-05",
    "time": "Morning",
    "weight": 10,
    "fat": 4.3,
    "snf": 8.5,
    "rate": 60.65,
    "total": 606.5,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-1272",
    "farmerId": "F-102",
    "farmerName": "Sandesh Kadam",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-05",
    "time": "Morning",
    "weight": 12,
    "fat": 4.3,
    "snf": 8.5,
    "rate": 60.65,
    "total": 727.8,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-1274",
    "farmerId": "F-103",
    "farmerName": "Mahesh Yadav",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-05",
    "time": "Morning",
    "weight": 14,
    "fat": 4.3,
    "snf": 8.5,
    "rate": 60.65,
    "total": 849.1,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-1280",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-04",
    "time": "Morning",
    "weight": 10.5,
    "fat": 4,
    "snf": 8.5,
    "rate": 59,
    "total": 619.5,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-1282",
    "farmerId": "F-102",
    "farmerName": "Sandesh Kadam",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-04",
    "time": "Morning",
    "weight": 12.5,
    "fat": 4,
    "snf": 8.5,
    "rate": 59,
    "total": 737.5,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-1284",
    "farmerId": "F-103",
    "farmerName": "Mahesh Yadav",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-04",
    "time": "Morning",
    "weight": 14.5,
    "fat": 4,
    "snf": 8.5,
    "rate": 59,
    "total": 855.5,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-1290",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-03",
    "time": "Morning",
    "weight": 11,
    "fat": 4.1,
    "snf": 8.5,
    "rate": 59.55,
    "total": 655.05,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-1292",
    "farmerId": "F-102",
    "farmerName": "Sandesh Kadam",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-03",
    "time": "Morning",
    "weight": 13,
    "fat": 4.1,
    "snf": 8.5,
    "rate": 59.55,
    "total": 774.15,
    "status": "Success",
    "branchId": "B-01"
  },
  {
    "id": "PAY-1294",
    "farmerId": "F-103",
    "farmerName": "Mahesh Yadav",
    "village": "Kolhapur, Maharashtra",
    "date": "2026-07-03",
    "time": "Morning",
    "weight": 15,
    "fat": 4.1,
    "snf": 8.5,
    "rate": 59.55,
    "total": 893.25,
    "status": "Success",
    "branchId": "B-01"
  }
];

export const mockPayments: PaymentItem[] = [
  {
    "id": "PAY-5330",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "date": "2026-08-04",
    "time": "10:40 pm",
    "amount": 732.5,
    "status": "Success",
    "timeline": [
      {
        "time": "10:40 pm",
        "label": "Milk Received",
        "status": "completed",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "time": "10:40 pm",
        "label": "Quality Analysis",
        "status": "completed",
        "description": "FAT: 4.2%, SNF: 8.5%, Rate: \u20b958.6/L"
      },
      {
        "time": "10:40 pm",
        "label": "Pricing Calculated",
        "status": "completed",
        "description": "Net payout calculated: \u20b9732.5"
      },
      {
        "time": "10:40 pm",
        "label": "Bank Transfer",
        "status": "completed",
        "description": "Sent to name@upi via Bank Gateway. UTR: TXN79594127"
      }
    ]
  },
  {
    "id": "PAY-0698",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "date": "2026-08-04",
    "time": "09:57 pm",
    "amount": 1172,
    "status": "Success",
    "timeline": [
      {
        "time": "09:57 pm",
        "label": "Milk Received",
        "status": "completed",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "time": "09:57 pm",
        "label": "Quality Analysis",
        "status": "completed",
        "description": "FAT: 4.2%, SNF: 8.5%, Rate: \u20b958.6/L"
      },
      {
        "time": "09:57 pm",
        "label": "Pricing Calculated",
        "status": "completed",
        "description": "Net payout calculated: \u20b91172"
      },
      {
        "time": "09:57 pm",
        "label": "Bank Transfer",
        "status": "completed",
        "description": "Sent to name@upi via Bank Gateway. UTR: TXN27690263"
      }
    ]
  },
  {
    "id": "PAY-4955",
    "farmerId": "F-105",
    "farmerName": "Pritesh Ahire",
    "date": "2026-08-03",
    "time": "10:22 pm",
    "amount": 58.6,
    "status": "Success",
    "timeline": [
      {
        "time": "10:22 pm",
        "label": "Milk Received",
        "status": "completed",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "time": "10:22 pm",
        "label": "Quality Analysis",
        "status": "completed",
        "description": "FAT: 4.2%, SNF: 8.5%, Rate: \u20b958.6/L"
      },
      {
        "time": "10:22 pm",
        "label": "Pricing Calculated",
        "status": "completed",
        "description": "Net payout calculated: \u20b958.6"
      },
      {
        "time": "10:22 pm",
        "label": "Bank Transfer",
        "status": "completed",
        "description": "Sent to pritesh@upi via Bank Gateway. UTR: TXN58301593"
      }
    ]
  },
  {
    "id": "PAY-7335",
    "farmerId": "F-105",
    "farmerName": "Pritesh Ahire",
    "date": "2026-08-03",
    "time": "11:11 am",
    "amount": 58.6,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "11:11 am",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "11:11 am",
        "description": "FAT: 4.2%, SNF: 8.5%, Rate: \u20b958.6/L"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "11:11 am",
        "description": "Net payout calculated: \u20b958.6"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "11:11 am",
        "description": "Sent to pritesh@upi via Bank Gateway. UTR: TXN94548475"
      }
    ]
  },
  {
    "id": "PAY-2226",
    "farmerId": "F-105",
    "farmerName": "Pritesh Ahire",
    "date": "2026-08-03",
    "time": "10:56 am",
    "amount": 60.1,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "10:56 am",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "10:56 am",
        "description": "FAT: 4.2%, SNF: 8.5%, Rate: \u20b960.1/L"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "10:56 am",
        "description": "Net payout calculated: \u20b960.1"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "10:56 am",
        "description": "Sent to pritesh@upi via Bank Gateway. UTR: TXN74306309"
      }
    ]
  },
  {
    "id": "PAY-0673",
    "farmerId": "F-104",
    "farmerName": "Om Rudnure",
    "date": "2026-08-02",
    "time": "11:50 pm",
    "amount": 864,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "11:50 pm",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "11:50 pm",
        "description": "FAT: 6%, SNF: 9.5%, Rate: \u20b972/L"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "11:50 pm",
        "description": "Net payout calculated: \u20b9864"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "11:50 pm",
        "description": "Sent to om@upi via Bank Gateway. UTR: TXN68768393"
      }
    ]
  },
  {
    "id": "PAY-3201",
    "farmerId": "F-104",
    "farmerName": "Om Rudnure",
    "date": "2026-08-02",
    "time": "11:50 pm",
    "amount": 525,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "11:50 pm",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "11:50 pm",
        "description": "FAT: 2.5%, SNF: 5%, Rate: \u20b943.75/L"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "11:50 pm",
        "description": "Net payout calculated: \u20b9525"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "11:50 pm",
        "description": "Sent to om@upi via Bank Gateway. UTR: TXN95070667"
      }
    ]
  },
  {
    "id": "PAY-6235",
    "farmerId": "F-103",
    "farmerName": "Mahesh Yadav",
    "date": "2026-08-02",
    "time": "11:49 pm",
    "amount": 525,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "11:49 pm",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "11:49 pm",
        "description": "FAT: 2.5%, SNF: 5%, Rate: \u20b943.75/L"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "11:49 pm",
        "description": "Net payout calculated: \u20b9525"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "11:49 pm",
        "description": "Sent to Mahesh@upi via Bank Gateway. UTR: TXN20069143"
      }
    ]
  },
  {
    "id": "PAY-9825",
    "farmerId": "F-103",
    "farmerName": "Mahesh Yadav",
    "date": "2026-08-02",
    "time": "11:49 pm",
    "amount": 525,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "11:49 pm",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "11:49 pm",
        "description": "FAT: 2.5%, SNF: 5%, Rate: \u20b943.75/L"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "11:49 pm",
        "description": "Net payout calculated: \u20b9525"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "11:49 pm",
        "description": "Sent to Mahesh@upi via Bank Gateway. UTR: TXN19976774"
      }
    ]
  },
  {
    "id": "PAY-9955",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "date": "2026-08-02",
    "time": "10:10 am",
    "amount": 53.85,
    "status": "Success",
    "timeline": []
  },
  {
    "id": "PAY-5105",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "date": "2026-07-30",
    "time": "10:26 am",
    "amount": 355.5,
    "status": "Success",
    "timeline": []
  },
  {
    "id": "PAY-2343",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "date": "2026-08-01",
    "time": "01:03 am",
    "amount": 447.6,
    "status": "Success",
    "timeline": []
  },
  {
    "id": "PAY-7511",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "date": "2026-08-01",
    "time": "01:25 am",
    "amount": 271.8,
    "status": "Success",
    "timeline": []
  },
  {
    "id": "PAY-0801",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "date": "2026-08-01",
    "time": "01:24 am",
    "amount": 22.65,
    "status": "Success",
    "timeline": []
  },
  {
    "id": "PAY-1031",
    "farmerId": "F-103",
    "farmerName": "Mahesh Yadav",
    "date": "2026-08-01",
    "time": "01:25 am",
    "amount": 447.6,
    "status": "Success",
    "timeline": [
      {
        "time": "01:25 am",
        "label": "Milk Received",
        "status": "completed",
        "description": "Logged at Kolhapur hub."
      },
      {
        "time": "01:25 am",
        "label": "Quality Analysis",
        "status": "completed",
        "description": "FAT: 4.2%, SNF: 8.5%"
      },
      {
        "time": "01:25 am",
        "label": "Pricing Calculated",
        "status": "completed",
        "description": "Net payout: \u20b9447.60"
      },
      {
        "time": "01:25 am",
        "label": "Bank Transfer",
        "status": "completed",
        "description": "Sent to Mahesh@upi. UTR: TXN103001"
      }
    ]
  },
  {
    "id": "PAY-1011",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "date": "2026-08-02",
    "time": "10:10 am",
    "amount": 447.6,
    "status": "Success",
    "timeline": [
      {
        "time": "10:10 am",
        "label": "Milk Received",
        "status": "completed",
        "description": "Logged at Kolhapur hub."
      },
      {
        "time": "10:10 am",
        "label": "Quality Analysis",
        "status": "completed",
        "description": "FAT: 4.1%, SNF: 8.5%"
      },
      {
        "time": "10:10 am",
        "label": "Pricing Calculated",
        "status": "completed",
        "description": "Net payout: \u20b9447.60"
      },
      {
        "time": "10:10 am",
        "label": "Bank Transfer",
        "status": "completed",
        "description": "Sent to name@upi. UTR: TXN101001"
      }
    ]
  },
  {
    "id": "PAY-1021",
    "farmerId": "F-102",
    "farmerName": "Sandesh Kadam",
    "date": "2026-08-02",
    "time": "10:05 am",
    "amount": 559.5,
    "status": "Success",
    "timeline": [
      {
        "time": "10:05 am",
        "label": "Milk Received",
        "status": "completed",
        "description": "Logged at Kolhapur hub."
      },
      {
        "time": "10:05 am",
        "label": "Quality Analysis",
        "status": "completed",
        "description": "FAT: 4.2%, SNF: 8.5%"
      },
      {
        "time": "10:05 am",
        "label": "Pricing Calculated",
        "status": "completed",
        "description": "Net payout: \u20b9559.50"
      },
      {
        "time": "10:05 am",
        "label": "Bank Transfer",
        "status": "completed",
        "description": "Sent to name@upi. UTR: TXN102001"
      }
    ]
  },
  {
    "id": "PAY-1000",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "date": "2026-08-01",
    "time": "07:30 am",
    "amount": 590,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "07:30 am",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "07:30 am",
        "description": "FAT: 4%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "07:30 am",
        "description": "Rate: \u20b959/L, Net: \u20b9590"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "07:30 am",
        "description": "Sent to name@upi. UTR: TXN90000000"
      }
    ]
  },
  {
    "id": "PAY-5000",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "date": "2026-08-01",
    "time": "06:15 pm",
    "amount": 476.4,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "06:15 pm",
        "description": "FAT: 4.1%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Rate: \u20b959.55/L, Net: \u20b9476.4"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Sent to name@upi. UTR: TXN95000000"
      }
    ]
  },
  {
    "id": "PAY-1002",
    "farmerId": "F-102",
    "farmerName": "Sandesh Kadam",
    "date": "2026-08-01",
    "time": "07:30 am",
    "amount": 708,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "07:30 am",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "07:30 am",
        "description": "FAT: 4%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "07:30 am",
        "description": "Rate: \u20b959/L, Net: \u20b9708"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "07:30 am",
        "description": "Sent to name@upi. UTR: TXN90000001"
      }
    ]
  },
  {
    "id": "PAY-5002",
    "farmerId": "F-102",
    "farmerName": "Sandesh Kadam",
    "date": "2026-08-01",
    "time": "06:15 pm",
    "amount": 565.73,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "06:15 pm",
        "description": "FAT: 4.1%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Rate: \u20b959.55/L, Net: \u20b9565.73"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Sent to name@upi. UTR: TXN95000001"
      }
    ]
  },
  {
    "id": "PAY-1004",
    "farmerId": "F-103",
    "farmerName": "Mahesh Yadav",
    "date": "2026-08-01",
    "time": "07:30 am",
    "amount": 826,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "07:30 am",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "07:30 am",
        "description": "FAT: 4%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "07:30 am",
        "description": "Rate: \u20b959/L, Net: \u20b9826"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "07:30 am",
        "description": "Sent to Mahesh@upi. UTR: TXN90000002"
      }
    ]
  },
  {
    "id": "PAY-5004",
    "farmerId": "F-103",
    "farmerName": "Mahesh Yadav",
    "date": "2026-08-01",
    "time": "06:15 pm",
    "amount": 655.05,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "06:15 pm",
        "description": "FAT: 4.1%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Rate: \u20b959.55/L, Net: \u20b9655.05"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Sent to Mahesh@upi. UTR: TXN95000002"
      }
    ]
  },
  {
    "id": "PAY-1010",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "date": "2026-07-31",
    "time": "07:30 am",
    "amount": 625.28,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "07:30 am",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "07:30 am",
        "description": "FAT: 4.1%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "07:30 am",
        "description": "Rate: \u20b959.55/L, Net: \u20b9625.28"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "07:30 am",
        "description": "Sent to name@upi. UTR: TXN90000100"
      }
    ]
  },
  {
    "id": "PAY-5010",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "date": "2026-07-31",
    "time": "06:15 pm",
    "amount": 510.85,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "06:15 pm",
        "description": "FAT: 4.2%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Rate: \u20b960.1/L, Net: \u20b9510.85"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Sent to name@upi. UTR: TXN95000100"
      }
    ]
  },
  {
    "id": "PAY-1012",
    "farmerId": "F-102",
    "farmerName": "Sandesh Kadam",
    "date": "2026-07-31",
    "time": "07:30 am",
    "amount": 744.38,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "07:30 am",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "07:30 am",
        "description": "FAT: 4.1%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "07:30 am",
        "description": "Rate: \u20b959.55/L, Net: \u20b9744.38"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "07:30 am",
        "description": "Sent to name@upi. UTR: TXN90000101"
      }
    ]
  },
  {
    "id": "PAY-5012",
    "farmerId": "F-102",
    "farmerName": "Sandesh Kadam",
    "date": "2026-07-31",
    "time": "06:15 pm",
    "amount": 601,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "06:15 pm",
        "description": "FAT: 4.2%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Rate: \u20b960.1/L, Net: \u20b9601"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Sent to name@upi. UTR: TXN95000101"
      }
    ]
  },
  {
    "id": "PAY-1014",
    "farmerId": "F-103",
    "farmerName": "Mahesh Yadav",
    "date": "2026-07-31",
    "time": "07:30 am",
    "amount": 863.47,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "07:30 am",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "07:30 am",
        "description": "FAT: 4.1%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "07:30 am",
        "description": "Rate: \u20b959.55/L, Net: \u20b9863.47"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "07:30 am",
        "description": "Sent to Mahesh@upi. UTR: TXN90000102"
      }
    ]
  },
  {
    "id": "PAY-5014",
    "farmerId": "F-103",
    "farmerName": "Mahesh Yadav",
    "date": "2026-07-31",
    "time": "06:15 pm",
    "amount": 691.15,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "06:15 pm",
        "description": "FAT: 4.2%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Rate: \u20b960.1/L, Net: \u20b9691.15"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Sent to Mahesh@upi. UTR: TXN95000102"
      }
    ]
  },
  {
    "id": "PAY-1020",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "date": "2026-07-30",
    "time": "07:30 am",
    "amount": 661.1,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "07:30 am",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "07:30 am",
        "description": "FAT: 4.2%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "07:30 am",
        "description": "Rate: \u20b960.1/L, Net: \u20b9661.1"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "07:30 am",
        "description": "Sent to name@upi. UTR: TXN90000200"
      }
    ]
  },
  {
    "id": "PAY-5020",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "date": "2026-07-30",
    "time": "06:15 pm",
    "amount": 485.2,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "06:15 pm",
        "description": "FAT: 4.3%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Rate: \u20b960.65/L, Net: \u20b9485.2"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Sent to name@upi. UTR: TXN95000200"
      }
    ]
  },
  {
    "id": "PAY-1022",
    "farmerId": "F-102",
    "farmerName": "Sandesh Kadam",
    "date": "2026-07-30",
    "time": "07:30 am",
    "amount": 781.3,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "07:30 am",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "07:30 am",
        "description": "FAT: 4.2%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "07:30 am",
        "description": "Rate: \u20b960.1/L, Net: \u20b9781.3"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "07:30 am",
        "description": "Sent to name@upi. UTR: TXN90000201"
      }
    ]
  },
  {
    "id": "PAY-5022",
    "farmerId": "F-102",
    "farmerName": "Sandesh Kadam",
    "date": "2026-07-30",
    "time": "06:15 pm",
    "amount": 576.17,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "06:15 pm",
        "description": "FAT: 4.3%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Rate: \u20b960.65/L, Net: \u20b9576.17"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Sent to name@upi. UTR: TXN95000201"
      }
    ]
  },
  {
    "id": "PAY-1024",
    "farmerId": "F-103",
    "farmerName": "Mahesh Yadav",
    "date": "2026-07-30",
    "time": "07:30 am",
    "amount": 901.5,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "07:30 am",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "07:30 am",
        "description": "FAT: 4.2%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "07:30 am",
        "description": "Rate: \u20b960.1/L, Net: \u20b9901.5"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "07:30 am",
        "description": "Sent to Mahesh@upi. UTR: TXN90000202"
      }
    ]
  },
  {
    "id": "PAY-5024",
    "farmerId": "F-103",
    "farmerName": "Mahesh Yadav",
    "date": "2026-07-30",
    "time": "06:15 pm",
    "amount": 667.15,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "06:15 pm",
        "description": "FAT: 4.3%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Rate: \u20b960.65/L, Net: \u20b9667.15"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Sent to Mahesh@upi. UTR: TXN95000202"
      }
    ]
  },
  {
    "id": "PAY-1030",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "date": "2026-07-29",
    "time": "07:30 am",
    "amount": 606.5,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "07:30 am",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "07:30 am",
        "description": "FAT: 4.3%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "07:30 am",
        "description": "Rate: \u20b960.65/L, Net: \u20b9606.5"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "07:30 am",
        "description": "Sent to name@upi. UTR: TXN90000300"
      }
    ]
  },
  {
    "id": "PAY-5030",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "date": "2026-07-29",
    "time": "06:15 pm",
    "amount": 506.17,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "06:15 pm",
        "description": "FAT: 4.1%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Rate: \u20b959.55/L, Net: \u20b9506.17"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Sent to name@upi. UTR: TXN95000300"
      }
    ]
  },
  {
    "id": "PAY-1032",
    "farmerId": "F-102",
    "farmerName": "Sandesh Kadam",
    "date": "2026-07-29",
    "time": "07:30 am",
    "amount": 727.8,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "07:30 am",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "07:30 am",
        "description": "FAT: 4.3%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "07:30 am",
        "description": "Rate: \u20b960.65/L, Net: \u20b9727.8"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "07:30 am",
        "description": "Sent to name@upi. UTR: TXN90000301"
      }
    ]
  },
  {
    "id": "PAY-5032",
    "farmerId": "F-102",
    "farmerName": "Sandesh Kadam",
    "date": "2026-07-29",
    "time": "06:15 pm",
    "amount": 595.5,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "06:15 pm",
        "description": "FAT: 4.1%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Rate: \u20b959.55/L, Net: \u20b9595.5"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Sent to name@upi. UTR: TXN95000301"
      }
    ]
  },
  {
    "id": "PAY-1034",
    "farmerId": "F-103",
    "farmerName": "Mahesh Yadav",
    "date": "2026-07-29",
    "time": "07:30 am",
    "amount": 849.1,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "07:30 am",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "07:30 am",
        "description": "FAT: 4.3%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "07:30 am",
        "description": "Rate: \u20b960.65/L, Net: \u20b9849.1"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "07:30 am",
        "description": "Sent to Mahesh@upi. UTR: TXN90000302"
      }
    ]
  },
  {
    "id": "PAY-5034",
    "farmerId": "F-103",
    "farmerName": "Mahesh Yadav",
    "date": "2026-07-29",
    "time": "06:15 pm",
    "amount": 684.83,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "06:15 pm",
        "description": "FAT: 4.1%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Rate: \u20b959.55/L, Net: \u20b9684.83"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Sent to Mahesh@upi. UTR: TXN95000302"
      }
    ]
  },
  {
    "id": "PAY-1040",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "date": "2026-07-28",
    "time": "07:30 am",
    "amount": 619.5,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "07:30 am",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "07:30 am",
        "description": "FAT: 4%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "07:30 am",
        "description": "Rate: \u20b959/L, Net: \u20b9619.5"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "07:30 am",
        "description": "Sent to name@upi. UTR: TXN90000400"
      }
    ]
  },
  {
    "id": "PAY-5040",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "date": "2026-07-28",
    "time": "06:15 pm",
    "amount": 480.8,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "06:15 pm",
        "description": "FAT: 4.2%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Rate: \u20b960.1/L, Net: \u20b9480.8"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Sent to name@upi. UTR: TXN95000400"
      }
    ]
  },
  {
    "id": "PAY-1042",
    "farmerId": "F-102",
    "farmerName": "Sandesh Kadam",
    "date": "2026-07-28",
    "time": "07:30 am",
    "amount": 737.5,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "07:30 am",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "07:30 am",
        "description": "FAT: 4%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "07:30 am",
        "description": "Rate: \u20b959/L, Net: \u20b9737.5"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "07:30 am",
        "description": "Sent to name@upi. UTR: TXN90000401"
      }
    ]
  },
  {
    "id": "PAY-5042",
    "farmerId": "F-102",
    "farmerName": "Sandesh Kadam",
    "date": "2026-07-28",
    "time": "06:15 pm",
    "amount": 570.95,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "06:15 pm",
        "description": "FAT: 4.2%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Rate: \u20b960.1/L, Net: \u20b9570.95"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Sent to name@upi. UTR: TXN95000401"
      }
    ]
  },
  {
    "id": "PAY-1044",
    "farmerId": "F-103",
    "farmerName": "Mahesh Yadav",
    "date": "2026-07-28",
    "time": "07:30 am",
    "amount": 855.5,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "07:30 am",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "07:30 am",
        "description": "FAT: 4%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "07:30 am",
        "description": "Rate: \u20b959/L, Net: \u20b9855.5"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "07:30 am",
        "description": "Sent to Mahesh@upi. UTR: TXN90000402"
      }
    ]
  },
  {
    "id": "PAY-5044",
    "farmerId": "F-103",
    "farmerName": "Mahesh Yadav",
    "date": "2026-07-28",
    "time": "06:15 pm",
    "amount": 661.1,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "06:15 pm",
        "description": "FAT: 4.2%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Rate: \u20b960.1/L, Net: \u20b9661.1"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Sent to Mahesh@upi. UTR: TXN95000402"
      }
    ]
  },
  {
    "id": "PAY-1050",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "date": "2026-07-27",
    "time": "07:30 am",
    "amount": 655.05,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "07:30 am",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "07:30 am",
        "description": "FAT: 4.1%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "07:30 am",
        "description": "Rate: \u20b959.55/L, Net: \u20b9655.05"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "07:30 am",
        "description": "Sent to name@upi. UTR: TXN90000500"
      }
    ]
  },
  {
    "id": "PAY-5050",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "date": "2026-07-27",
    "time": "06:15 pm",
    "amount": 515.53,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "06:15 pm",
        "description": "FAT: 4.3%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Rate: \u20b960.65/L, Net: \u20b9515.53"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Sent to name@upi. UTR: TXN95000500"
      }
    ]
  },
  {
    "id": "PAY-1052",
    "farmerId": "F-102",
    "farmerName": "Sandesh Kadam",
    "date": "2026-07-27",
    "time": "07:30 am",
    "amount": 774.15,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "07:30 am",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "07:30 am",
        "description": "FAT: 4.1%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "07:30 am",
        "description": "Rate: \u20b959.55/L, Net: \u20b9774.15"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "07:30 am",
        "description": "Sent to name@upi. UTR: TXN90000501"
      }
    ]
  },
  {
    "id": "PAY-5052",
    "farmerId": "F-102",
    "farmerName": "Sandesh Kadam",
    "date": "2026-07-27",
    "time": "06:15 pm",
    "amount": 606.5,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "06:15 pm",
        "description": "FAT: 4.3%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Rate: \u20b960.65/L, Net: \u20b9606.5"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Sent to name@upi. UTR: TXN95000501"
      }
    ]
  },
  {
    "id": "PAY-1054",
    "farmerId": "F-103",
    "farmerName": "Mahesh Yadav",
    "date": "2026-07-27",
    "time": "07:30 am",
    "amount": 893.25,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "07:30 am",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "07:30 am",
        "description": "FAT: 4.1%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "07:30 am",
        "description": "Rate: \u20b959.55/L, Net: \u20b9893.25"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "07:30 am",
        "description": "Sent to Mahesh@upi. UTR: TXN90000502"
      }
    ]
  },
  {
    "id": "PAY-5054",
    "farmerId": "F-103",
    "farmerName": "Mahesh Yadav",
    "date": "2026-07-27",
    "time": "06:15 pm",
    "amount": 697.48,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "06:15 pm",
        "description": "FAT: 4.3%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Rate: \u20b960.65/L, Net: \u20b9697.48"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Sent to Mahesh@upi. UTR: TXN95000502"
      }
    ]
  },
  {
    "id": "PAY-1060",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "date": "2026-07-26",
    "time": "07:30 am",
    "amount": 601,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "07:30 am",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "07:30 am",
        "description": "FAT: 4.2%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "07:30 am",
        "description": "Rate: \u20b960.1/L, Net: \u20b9601"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "07:30 am",
        "description": "Sent to name@upi. UTR: TXN90000600"
      }
    ]
  },
  {
    "id": "PAY-5060",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "date": "2026-07-26",
    "time": "06:15 pm",
    "amount": 476.4,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "06:15 pm",
        "description": "FAT: 4.1%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Rate: \u20b959.55/L, Net: \u20b9476.4"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Sent to name@upi. UTR: TXN95000600"
      }
    ]
  },
  {
    "id": "PAY-1062",
    "farmerId": "F-102",
    "farmerName": "Sandesh Kadam",
    "date": "2026-07-26",
    "time": "07:30 am",
    "amount": 721.2,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "07:30 am",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "07:30 am",
        "description": "FAT: 4.2%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "07:30 am",
        "description": "Rate: \u20b960.1/L, Net: \u20b9721.2"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "07:30 am",
        "description": "Sent to name@upi. UTR: TXN90000601"
      }
    ]
  },
  {
    "id": "PAY-5062",
    "farmerId": "F-102",
    "farmerName": "Sandesh Kadam",
    "date": "2026-07-26",
    "time": "06:15 pm",
    "amount": 565.73,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "06:15 pm",
        "description": "FAT: 4.1%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Rate: \u20b959.55/L, Net: \u20b9565.73"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Sent to name@upi. UTR: TXN95000601"
      }
    ]
  },
  {
    "id": "PAY-1064",
    "farmerId": "F-103",
    "farmerName": "Mahesh Yadav",
    "date": "2026-07-26",
    "time": "07:30 am",
    "amount": 841.4,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "07:30 am",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "07:30 am",
        "description": "FAT: 4.2%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "07:30 am",
        "description": "Rate: \u20b960.1/L, Net: \u20b9841.4"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "07:30 am",
        "description": "Sent to Mahesh@upi. UTR: TXN90000602"
      }
    ]
  },
  {
    "id": "PAY-5064",
    "farmerId": "F-103",
    "farmerName": "Mahesh Yadav",
    "date": "2026-07-26",
    "time": "06:15 pm",
    "amount": 655.05,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "06:15 pm",
        "description": "FAT: 4.1%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Rate: \u20b959.55/L, Net: \u20b9655.05"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Sent to Mahesh@upi. UTR: TXN95000602"
      }
    ]
  },
  {
    "id": "PAY-1070",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "date": "2026-07-25",
    "time": "07:30 am",
    "amount": 636.82,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "07:30 am",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "07:30 am",
        "description": "FAT: 4.3%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "07:30 am",
        "description": "Rate: \u20b960.65/L, Net: \u20b9636.82"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "07:30 am",
        "description": "Sent to name@upi. UTR: TXN90000700"
      }
    ]
  },
  {
    "id": "PAY-5070",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "date": "2026-07-25",
    "time": "06:15 pm",
    "amount": 510.85,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "06:15 pm",
        "description": "FAT: 4.2%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Rate: \u20b960.1/L, Net: \u20b9510.85"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Sent to name@upi. UTR: TXN95000700"
      }
    ]
  },
  {
    "id": "PAY-1072",
    "farmerId": "F-102",
    "farmerName": "Sandesh Kadam",
    "date": "2026-07-25",
    "time": "07:30 am",
    "amount": 758.13,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "07:30 am",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "07:30 am",
        "description": "FAT: 4.3%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "07:30 am",
        "description": "Rate: \u20b960.65/L, Net: \u20b9758.13"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "07:30 am",
        "description": "Sent to name@upi. UTR: TXN90000701"
      }
    ]
  },
  {
    "id": "PAY-5072",
    "farmerId": "F-102",
    "farmerName": "Sandesh Kadam",
    "date": "2026-07-25",
    "time": "06:15 pm",
    "amount": 601,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "06:15 pm",
        "description": "FAT: 4.2%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Rate: \u20b960.1/L, Net: \u20b9601"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Sent to name@upi. UTR: TXN95000701"
      }
    ]
  },
  {
    "id": "PAY-1074",
    "farmerId": "F-103",
    "farmerName": "Mahesh Yadav",
    "date": "2026-07-25",
    "time": "07:30 am",
    "amount": 879.43,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "07:30 am",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "07:30 am",
        "description": "FAT: 4.3%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "07:30 am",
        "description": "Rate: \u20b960.65/L, Net: \u20b9879.43"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "07:30 am",
        "description": "Sent to Mahesh@upi. UTR: TXN90000702"
      }
    ]
  },
  {
    "id": "PAY-5074",
    "farmerId": "F-103",
    "farmerName": "Mahesh Yadav",
    "date": "2026-07-25",
    "time": "06:15 pm",
    "amount": 691.15,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "06:15 pm",
        "description": "FAT: 4.2%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Rate: \u20b960.1/L, Net: \u20b9691.15"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Sent to Mahesh@upi. UTR: TXN95000702"
      }
    ]
  },
  {
    "id": "PAY-1080",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "date": "2026-07-24",
    "time": "07:30 am",
    "amount": 649,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "07:30 am",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "07:30 am",
        "description": "FAT: 4%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "07:30 am",
        "description": "Rate: \u20b959/L, Net: \u20b9649"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "07:30 am",
        "description": "Sent to name@upi. UTR: TXN90000800"
      }
    ]
  },
  {
    "id": "PAY-5080",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "date": "2026-07-24",
    "time": "06:15 pm",
    "amount": 485.2,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "06:15 pm",
        "description": "FAT: 4.3%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Rate: \u20b960.65/L, Net: \u20b9485.2"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Sent to name@upi. UTR: TXN95000800"
      }
    ]
  },
  {
    "id": "PAY-1082",
    "farmerId": "F-102",
    "farmerName": "Sandesh Kadam",
    "date": "2026-07-24",
    "time": "07:30 am",
    "amount": 767,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "07:30 am",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "07:30 am",
        "description": "FAT: 4%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "07:30 am",
        "description": "Rate: \u20b959/L, Net: \u20b9767"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "07:30 am",
        "description": "Sent to name@upi. UTR: TXN90000801"
      }
    ]
  },
  {
    "id": "PAY-5082",
    "farmerId": "F-102",
    "farmerName": "Sandesh Kadam",
    "date": "2026-07-24",
    "time": "06:15 pm",
    "amount": 576.17,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "06:15 pm",
        "description": "FAT: 4.3%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Rate: \u20b960.65/L, Net: \u20b9576.17"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Sent to name@upi. UTR: TXN95000801"
      }
    ]
  },
  {
    "id": "PAY-1084",
    "farmerId": "F-103",
    "farmerName": "Mahesh Yadav",
    "date": "2026-07-24",
    "time": "07:30 am",
    "amount": 885,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "07:30 am",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "07:30 am",
        "description": "FAT: 4%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "07:30 am",
        "description": "Rate: \u20b959/L, Net: \u20b9885"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "07:30 am",
        "description": "Sent to Mahesh@upi. UTR: TXN90000802"
      }
    ]
  },
  {
    "id": "PAY-5084",
    "farmerId": "F-103",
    "farmerName": "Mahesh Yadav",
    "date": "2026-07-24",
    "time": "06:15 pm",
    "amount": 667.15,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "06:15 pm",
        "description": "FAT: 4.3%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Rate: \u20b960.65/L, Net: \u20b9667.15"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Sent to Mahesh@upi. UTR: TXN95000802"
      }
    ]
  },
  {
    "id": "PAY-1090",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "date": "2026-07-23",
    "time": "07:30 am",
    "amount": 595.5,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "07:30 am",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "07:30 am",
        "description": "FAT: 4.1%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "07:30 am",
        "description": "Rate: \u20b959.55/L, Net: \u20b9595.5"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "07:30 am",
        "description": "Sent to name@upi. UTR: TXN90000900"
      }
    ]
  },
  {
    "id": "PAY-5090",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "date": "2026-07-23",
    "time": "06:15 pm",
    "amount": 506.17,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "06:15 pm",
        "description": "FAT: 4.1%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Rate: \u20b959.55/L, Net: \u20b9506.17"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Sent to name@upi. UTR: TXN95000900"
      }
    ]
  },
  {
    "id": "PAY-1092",
    "farmerId": "F-102",
    "farmerName": "Sandesh Kadam",
    "date": "2026-07-23",
    "time": "07:30 am",
    "amount": 714.6,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "07:30 am",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "07:30 am",
        "description": "FAT: 4.1%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "07:30 am",
        "description": "Rate: \u20b959.55/L, Net: \u20b9714.6"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "07:30 am",
        "description": "Sent to name@upi. UTR: TXN90000901"
      }
    ]
  },
  {
    "id": "PAY-5092",
    "farmerId": "F-102",
    "farmerName": "Sandesh Kadam",
    "date": "2026-07-23",
    "time": "06:15 pm",
    "amount": 595.5,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "06:15 pm",
        "description": "FAT: 4.1%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Rate: \u20b959.55/L, Net: \u20b9595.5"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Sent to name@upi. UTR: TXN95000901"
      }
    ]
  },
  {
    "id": "PAY-1094",
    "farmerId": "F-103",
    "farmerName": "Mahesh Yadav",
    "date": "2026-07-23",
    "time": "07:30 am",
    "amount": 833.7,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "07:30 am",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "07:30 am",
        "description": "FAT: 4.1%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "07:30 am",
        "description": "Rate: \u20b959.55/L, Net: \u20b9833.7"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "07:30 am",
        "description": "Sent to Mahesh@upi. UTR: TXN90000902"
      }
    ]
  },
  {
    "id": "PAY-5094",
    "farmerId": "F-103",
    "farmerName": "Mahesh Yadav",
    "date": "2026-07-23",
    "time": "06:15 pm",
    "amount": 684.83,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "06:15 pm",
        "description": "FAT: 4.1%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Rate: \u20b959.55/L, Net: \u20b9684.83"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Sent to Mahesh@upi. UTR: TXN95000902"
      }
    ]
  },
  {
    "id": "PAY-1100",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "date": "2026-07-22",
    "time": "07:30 am",
    "amount": 631.05,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "07:30 am",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "07:30 am",
        "description": "FAT: 4.2%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "07:30 am",
        "description": "Rate: \u20b960.1/L, Net: \u20b9631.05"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "07:30 am",
        "description": "Sent to name@upi. UTR: TXN90001000"
      }
    ]
  },
  {
    "id": "PAY-5100",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "date": "2026-07-22",
    "time": "06:15 pm",
    "amount": 480.8,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "06:15 pm",
        "description": "FAT: 4.2%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Rate: \u20b960.1/L, Net: \u20b9480.8"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Sent to name@upi. UTR: TXN95001000"
      }
    ]
  },
  {
    "id": "PAY-1102",
    "farmerId": "F-102",
    "farmerName": "Sandesh Kadam",
    "date": "2026-07-22",
    "time": "07:30 am",
    "amount": 751.25,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "07:30 am",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "07:30 am",
        "description": "FAT: 4.2%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "07:30 am",
        "description": "Rate: \u20b960.1/L, Net: \u20b9751.25"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "07:30 am",
        "description": "Sent to name@upi. UTR: TXN90001001"
      }
    ]
  },
  {
    "id": "PAY-5102",
    "farmerId": "F-102",
    "farmerName": "Sandesh Kadam",
    "date": "2026-07-22",
    "time": "06:15 pm",
    "amount": 570.95,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "06:15 pm",
        "description": "FAT: 4.2%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Rate: \u20b960.1/L, Net: \u20b9570.95"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Sent to name@upi. UTR: TXN95001001"
      }
    ]
  },
  {
    "id": "PAY-1104",
    "farmerId": "F-103",
    "farmerName": "Mahesh Yadav",
    "date": "2026-07-22",
    "time": "07:30 am",
    "amount": 871.45,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "07:30 am",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "07:30 am",
        "description": "FAT: 4.2%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "07:30 am",
        "description": "Rate: \u20b960.1/L, Net: \u20b9871.45"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "07:30 am",
        "description": "Sent to Mahesh@upi. UTR: TXN90001002"
      }
    ]
  },
  {
    "id": "PAY-5104",
    "farmerId": "F-103",
    "farmerName": "Mahesh Yadav",
    "date": "2026-07-22",
    "time": "06:15 pm",
    "amount": 661.1,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "06:15 pm",
        "description": "FAT: 4.2%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Rate: \u20b960.1/L, Net: \u20b9661.1"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Sent to Mahesh@upi. UTR: TXN95001002"
      }
    ]
  },
  {
    "id": "PAY-1110",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "date": "2026-07-21",
    "time": "07:30 am",
    "amount": 667.15,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "07:30 am",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "07:30 am",
        "description": "FAT: 4.3%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "07:30 am",
        "description": "Rate: \u20b960.65/L, Net: \u20b9667.15"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "07:30 am",
        "description": "Sent to name@upi. UTR: TXN90001100"
      }
    ]
  },
  {
    "id": "PAY-5110",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "date": "2026-07-21",
    "time": "06:15 pm",
    "amount": 515.53,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "06:15 pm",
        "description": "FAT: 4.3%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Rate: \u20b960.65/L, Net: \u20b9515.53"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Sent to name@upi. UTR: TXN95001100"
      }
    ]
  },
  {
    "id": "PAY-1112",
    "farmerId": "F-102",
    "farmerName": "Sandesh Kadam",
    "date": "2026-07-21",
    "time": "07:30 am",
    "amount": 788.45,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "07:30 am",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "07:30 am",
        "description": "FAT: 4.3%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "07:30 am",
        "description": "Rate: \u20b960.65/L, Net: \u20b9788.45"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "07:30 am",
        "description": "Sent to name@upi. UTR: TXN90001101"
      }
    ]
  },
  {
    "id": "PAY-5112",
    "farmerId": "F-102",
    "farmerName": "Sandesh Kadam",
    "date": "2026-07-21",
    "time": "06:15 pm",
    "amount": 606.5,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "06:15 pm",
        "description": "FAT: 4.3%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Rate: \u20b960.65/L, Net: \u20b9606.5"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Sent to name@upi. UTR: TXN95001101"
      }
    ]
  },
  {
    "id": "PAY-1114",
    "farmerId": "F-103",
    "farmerName": "Mahesh Yadav",
    "date": "2026-07-21",
    "time": "07:30 am",
    "amount": 909.75,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "07:30 am",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "07:30 am",
        "description": "FAT: 4.3%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "07:30 am",
        "description": "Rate: \u20b960.65/L, Net: \u20b9909.75"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "07:30 am",
        "description": "Sent to Mahesh@upi. UTR: TXN90001102"
      }
    ]
  },
  {
    "id": "PAY-5114",
    "farmerId": "F-103",
    "farmerName": "Mahesh Yadav",
    "date": "2026-07-21",
    "time": "06:15 pm",
    "amount": 697.48,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "06:15 pm",
        "description": "FAT: 4.3%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Rate: \u20b960.65/L, Net: \u20b9697.48"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Sent to Mahesh@upi. UTR: TXN95001102"
      }
    ]
  },
  {
    "id": "PAY-1120",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "date": "2026-07-20",
    "time": "07:30 am",
    "amount": 590,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "07:30 am",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "07:30 am",
        "description": "FAT: 4%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "07:30 am",
        "description": "Rate: \u20b959/L, Net: \u20b9590"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "07:30 am",
        "description": "Sent to name@upi. UTR: TXN90001200"
      }
    ]
  },
  {
    "id": "PAY-5120",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "date": "2026-07-20",
    "time": "06:15 pm",
    "amount": 476.4,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "06:15 pm",
        "description": "FAT: 4.1%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Rate: \u20b959.55/L, Net: \u20b9476.4"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Sent to name@upi. UTR: TXN95001200"
      }
    ]
  },
  {
    "id": "PAY-1122",
    "farmerId": "F-102",
    "farmerName": "Sandesh Kadam",
    "date": "2026-07-20",
    "time": "07:30 am",
    "amount": 708,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "07:30 am",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "07:30 am",
        "description": "FAT: 4%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "07:30 am",
        "description": "Rate: \u20b959/L, Net: \u20b9708"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "07:30 am",
        "description": "Sent to name@upi. UTR: TXN90001201"
      }
    ]
  },
  {
    "id": "PAY-5122",
    "farmerId": "F-102",
    "farmerName": "Sandesh Kadam",
    "date": "2026-07-20",
    "time": "06:15 pm",
    "amount": 565.73,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "06:15 pm",
        "description": "FAT: 4.1%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Rate: \u20b959.55/L, Net: \u20b9565.73"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Sent to name@upi. UTR: TXN95001201"
      }
    ]
  },
  {
    "id": "PAY-1124",
    "farmerId": "F-103",
    "farmerName": "Mahesh Yadav",
    "date": "2026-07-20",
    "time": "07:30 am",
    "amount": 826,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "07:30 am",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "07:30 am",
        "description": "FAT: 4%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "07:30 am",
        "description": "Rate: \u20b959/L, Net: \u20b9826"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "07:30 am",
        "description": "Sent to Mahesh@upi. UTR: TXN90001202"
      }
    ]
  },
  {
    "id": "PAY-5124",
    "farmerId": "F-103",
    "farmerName": "Mahesh Yadav",
    "date": "2026-07-20",
    "time": "06:15 pm",
    "amount": 655.05,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "06:15 pm",
        "description": "FAT: 4.1%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Rate: \u20b959.55/L, Net: \u20b9655.05"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Sent to Mahesh@upi. UTR: TXN95001202"
      }
    ]
  },
  {
    "id": "PAY-1130",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "date": "2026-07-19",
    "time": "07:30 am",
    "amount": 625.28,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "07:30 am",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "07:30 am",
        "description": "FAT: 4.1%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "07:30 am",
        "description": "Rate: \u20b959.55/L, Net: \u20b9625.28"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "07:30 am",
        "description": "Sent to name@upi. UTR: TXN90001300"
      }
    ]
  },
  {
    "id": "PAY-5130",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "date": "2026-07-19",
    "time": "06:15 pm",
    "amount": 510.85,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "06:15 pm",
        "description": "FAT: 4.2%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Rate: \u20b960.1/L, Net: \u20b9510.85"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Sent to name@upi. UTR: TXN95001300"
      }
    ]
  },
  {
    "id": "PAY-1132",
    "farmerId": "F-102",
    "farmerName": "Sandesh Kadam",
    "date": "2026-07-19",
    "time": "07:30 am",
    "amount": 744.38,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "07:30 am",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "07:30 am",
        "description": "FAT: 4.1%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "07:30 am",
        "description": "Rate: \u20b959.55/L, Net: \u20b9744.38"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "07:30 am",
        "description": "Sent to name@upi. UTR: TXN90001301"
      }
    ]
  },
  {
    "id": "PAY-5132",
    "farmerId": "F-102",
    "farmerName": "Sandesh Kadam",
    "date": "2026-07-19",
    "time": "06:15 pm",
    "amount": 601,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "06:15 pm",
        "description": "FAT: 4.2%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Rate: \u20b960.1/L, Net: \u20b9601"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Sent to name@upi. UTR: TXN95001301"
      }
    ]
  },
  {
    "id": "PAY-1134",
    "farmerId": "F-103",
    "farmerName": "Mahesh Yadav",
    "date": "2026-07-19",
    "time": "07:30 am",
    "amount": 863.47,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "07:30 am",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "07:30 am",
        "description": "FAT: 4.1%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "07:30 am",
        "description": "Rate: \u20b959.55/L, Net: \u20b9863.47"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "07:30 am",
        "description": "Sent to Mahesh@upi. UTR: TXN90001302"
      }
    ]
  },
  {
    "id": "PAY-5134",
    "farmerId": "F-103",
    "farmerName": "Mahesh Yadav",
    "date": "2026-07-19",
    "time": "06:15 pm",
    "amount": 691.15,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "06:15 pm",
        "description": "FAT: 4.2%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Rate: \u20b960.1/L, Net: \u20b9691.15"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Sent to Mahesh@upi. UTR: TXN95001302"
      }
    ]
  },
  {
    "id": "PAY-1140",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "date": "2026-07-18",
    "time": "07:30 am",
    "amount": 661.1,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "07:30 am",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "07:30 am",
        "description": "FAT: 4.2%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "07:30 am",
        "description": "Rate: \u20b960.1/L, Net: \u20b9661.1"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "07:30 am",
        "description": "Sent to name@upi. UTR: TXN90001400"
      }
    ]
  },
  {
    "id": "PAY-5140",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "date": "2026-07-18",
    "time": "06:15 pm",
    "amount": 485.2,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "06:15 pm",
        "description": "FAT: 4.3%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Rate: \u20b960.65/L, Net: \u20b9485.2"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Sent to name@upi. UTR: TXN95001400"
      }
    ]
  },
  {
    "id": "PAY-1142",
    "farmerId": "F-102",
    "farmerName": "Sandesh Kadam",
    "date": "2026-07-18",
    "time": "07:30 am",
    "amount": 781.3,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "07:30 am",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "07:30 am",
        "description": "FAT: 4.2%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "07:30 am",
        "description": "Rate: \u20b960.1/L, Net: \u20b9781.3"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "07:30 am",
        "description": "Sent to name@upi. UTR: TXN90001401"
      }
    ]
  },
  {
    "id": "PAY-5142",
    "farmerId": "F-102",
    "farmerName": "Sandesh Kadam",
    "date": "2026-07-18",
    "time": "06:15 pm",
    "amount": 576.17,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "06:15 pm",
        "description": "FAT: 4.3%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Rate: \u20b960.65/L, Net: \u20b9576.17"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Sent to name@upi. UTR: TXN95001401"
      }
    ]
  },
  {
    "id": "PAY-1144",
    "farmerId": "F-103",
    "farmerName": "Mahesh Yadav",
    "date": "2026-07-18",
    "time": "07:30 am",
    "amount": 901.5,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "07:30 am",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "07:30 am",
        "description": "FAT: 4.2%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "07:30 am",
        "description": "Rate: \u20b960.1/L, Net: \u20b9901.5"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "07:30 am",
        "description": "Sent to Mahesh@upi. UTR: TXN90001402"
      }
    ]
  },
  {
    "id": "PAY-5144",
    "farmerId": "F-103",
    "farmerName": "Mahesh Yadav",
    "date": "2026-07-18",
    "time": "06:15 pm",
    "amount": 667.15,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "06:15 pm",
        "description": "FAT: 4.3%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Rate: \u20b960.65/L, Net: \u20b9667.15"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "06:15 pm",
        "description": "Sent to Mahesh@upi. UTR: TXN95001402"
      }
    ]
  },
  {
    "id": "PAY-1150",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "date": "2026-07-17",
    "time": "07:30 am",
    "amount": 606.5,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "07:30 am",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "07:30 am",
        "description": "FAT: 4.3%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "07:30 am",
        "description": "Rate: \u20b960.65/L, Net: \u20b9606.5"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "07:30 am",
        "description": "Sent to name@upi. UTR: TXN90001500"
      }
    ]
  },
  {
    "id": "PAY-1152",
    "farmerId": "F-102",
    "farmerName": "Sandesh Kadam",
    "date": "2026-07-17",
    "time": "07:30 am",
    "amount": 727.8,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "07:30 am",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "07:30 am",
        "description": "FAT: 4.3%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "07:30 am",
        "description": "Rate: \u20b960.65/L, Net: \u20b9727.8"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "07:30 am",
        "description": "Sent to name@upi. UTR: TXN90001501"
      }
    ]
  },
  {
    "id": "PAY-1154",
    "farmerId": "F-103",
    "farmerName": "Mahesh Yadav",
    "date": "2026-07-17",
    "time": "07:30 am",
    "amount": 849.1,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "07:30 am",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "07:30 am",
        "description": "FAT: 4.3%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "07:30 am",
        "description": "Rate: \u20b960.65/L, Net: \u20b9849.1"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "07:30 am",
        "description": "Sent to Mahesh@upi. UTR: TXN90001502"
      }
    ]
  },
  {
    "id": "PAY-1160",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "date": "2026-07-16",
    "time": "07:30 am",
    "amount": 619.5,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "07:30 am",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "07:30 am",
        "description": "FAT: 4%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "07:30 am",
        "description": "Rate: \u20b959/L, Net: \u20b9619.5"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "07:30 am",
        "description": "Sent to name@upi. UTR: TXN90001600"
      }
    ]
  },
  {
    "id": "PAY-1162",
    "farmerId": "F-102",
    "farmerName": "Sandesh Kadam",
    "date": "2026-07-16",
    "time": "07:30 am",
    "amount": 737.5,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "07:30 am",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "07:30 am",
        "description": "FAT: 4%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "07:30 am",
        "description": "Rate: \u20b959/L, Net: \u20b9737.5"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "07:30 am",
        "description": "Sent to name@upi. UTR: TXN90001601"
      }
    ]
  },
  {
    "id": "PAY-1164",
    "farmerId": "F-103",
    "farmerName": "Mahesh Yadav",
    "date": "2026-07-16",
    "time": "07:30 am",
    "amount": 855.5,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "07:30 am",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "07:30 am",
        "description": "FAT: 4%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "07:30 am",
        "description": "Rate: \u20b959/L, Net: \u20b9855.5"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "07:30 am",
        "description": "Sent to Mahesh@upi. UTR: TXN90001602"
      }
    ]
  },
  {
    "id": "PAY-1170",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "date": "2026-07-15",
    "time": "07:30 am",
    "amount": 655.05,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "07:30 am",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "07:30 am",
        "description": "FAT: 4.1%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "07:30 am",
        "description": "Rate: \u20b959.55/L, Net: \u20b9655.05"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "07:30 am",
        "description": "Sent to name@upi. UTR: TXN90001700"
      }
    ]
  },
  {
    "id": "PAY-1172",
    "farmerId": "F-102",
    "farmerName": "Sandesh Kadam",
    "date": "2026-07-15",
    "time": "07:30 am",
    "amount": 774.15,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "07:30 am",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "07:30 am",
        "description": "FAT: 4.1%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "07:30 am",
        "description": "Rate: \u20b959.55/L, Net: \u20b9774.15"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "07:30 am",
        "description": "Sent to name@upi. UTR: TXN90001701"
      }
    ]
  },
  {
    "id": "PAY-1174",
    "farmerId": "F-103",
    "farmerName": "Mahesh Yadav",
    "date": "2026-07-15",
    "time": "07:30 am",
    "amount": 893.25,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "07:30 am",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "07:30 am",
        "description": "FAT: 4.1%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "07:30 am",
        "description": "Rate: \u20b959.55/L, Net: \u20b9893.25"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "07:30 am",
        "description": "Sent to Mahesh@upi. UTR: TXN90001702"
      }
    ]
  },
  {
    "id": "PAY-1180",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "date": "2026-07-14",
    "time": "07:30 am",
    "amount": 601,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "07:30 am",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "07:30 am",
        "description": "FAT: 4.2%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "07:30 am",
        "description": "Rate: \u20b960.1/L, Net: \u20b9601"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "07:30 am",
        "description": "Sent to name@upi. UTR: TXN90001800"
      }
    ]
  },
  {
    "id": "PAY-1182",
    "farmerId": "F-102",
    "farmerName": "Sandesh Kadam",
    "date": "2026-07-14",
    "time": "07:30 am",
    "amount": 721.2,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "07:30 am",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "07:30 am",
        "description": "FAT: 4.2%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "07:30 am",
        "description": "Rate: \u20b960.1/L, Net: \u20b9721.2"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "07:30 am",
        "description": "Sent to name@upi. UTR: TXN90001801"
      }
    ]
  },
  {
    "id": "PAY-1184",
    "farmerId": "F-103",
    "farmerName": "Mahesh Yadav",
    "date": "2026-07-14",
    "time": "07:30 am",
    "amount": 841.4,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "07:30 am",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "07:30 am",
        "description": "FAT: 4.2%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "07:30 am",
        "description": "Rate: \u20b960.1/L, Net: \u20b9841.4"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "07:30 am",
        "description": "Sent to Mahesh@upi. UTR: TXN90001802"
      }
    ]
  },
  {
    "id": "PAY-1190",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "date": "2026-07-13",
    "time": "07:30 am",
    "amount": 636.82,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "07:30 am",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "07:30 am",
        "description": "FAT: 4.3%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "07:30 am",
        "description": "Rate: \u20b960.65/L, Net: \u20b9636.82"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "07:30 am",
        "description": "Sent to name@upi. UTR: TXN90001900"
      }
    ]
  },
  {
    "id": "PAY-1192",
    "farmerId": "F-102",
    "farmerName": "Sandesh Kadam",
    "date": "2026-07-13",
    "time": "07:30 am",
    "amount": 758.13,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "07:30 am",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "07:30 am",
        "description": "FAT: 4.3%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "07:30 am",
        "description": "Rate: \u20b960.65/L, Net: \u20b9758.13"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "07:30 am",
        "description": "Sent to name@upi. UTR: TXN90001901"
      }
    ]
  },
  {
    "id": "PAY-1194",
    "farmerId": "F-103",
    "farmerName": "Mahesh Yadav",
    "date": "2026-07-13",
    "time": "07:30 am",
    "amount": 879.43,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "07:30 am",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "07:30 am",
        "description": "FAT: 4.3%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "07:30 am",
        "description": "Rate: \u20b960.65/L, Net: \u20b9879.43"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "07:30 am",
        "description": "Sent to Mahesh@upi. UTR: TXN90001902"
      }
    ]
  },
  {
    "id": "PAY-1200",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "date": "2026-07-12",
    "time": "07:30 am",
    "amount": 649,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "07:30 am",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "07:30 am",
        "description": "FAT: 4%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "07:30 am",
        "description": "Rate: \u20b959/L, Net: \u20b9649"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "07:30 am",
        "description": "Sent to name@upi. UTR: TXN90002000"
      }
    ]
  },
  {
    "id": "PAY-1202",
    "farmerId": "F-102",
    "farmerName": "Sandesh Kadam",
    "date": "2026-07-12",
    "time": "07:30 am",
    "amount": 767,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "07:30 am",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "07:30 am",
        "description": "FAT: 4%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "07:30 am",
        "description": "Rate: \u20b959/L, Net: \u20b9767"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "07:30 am",
        "description": "Sent to name@upi. UTR: TXN90002001"
      }
    ]
  },
  {
    "id": "PAY-1204",
    "farmerId": "F-103",
    "farmerName": "Mahesh Yadav",
    "date": "2026-07-12",
    "time": "07:30 am",
    "amount": 885,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "07:30 am",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "07:30 am",
        "description": "FAT: 4%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "07:30 am",
        "description": "Rate: \u20b959/L, Net: \u20b9885"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "07:30 am",
        "description": "Sent to Mahesh@upi. UTR: TXN90002002"
      }
    ]
  },
  {
    "id": "PAY-1210",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "date": "2026-07-11",
    "time": "07:30 am",
    "amount": 595.5,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "07:30 am",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "07:30 am",
        "description": "FAT: 4.1%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "07:30 am",
        "description": "Rate: \u20b959.55/L, Net: \u20b9595.5"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "07:30 am",
        "description": "Sent to name@upi. UTR: TXN90002100"
      }
    ]
  },
  {
    "id": "PAY-1212",
    "farmerId": "F-102",
    "farmerName": "Sandesh Kadam",
    "date": "2026-07-11",
    "time": "07:30 am",
    "amount": 714.6,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "07:30 am",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "07:30 am",
        "description": "FAT: 4.1%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "07:30 am",
        "description": "Rate: \u20b959.55/L, Net: \u20b9714.6"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "07:30 am",
        "description": "Sent to name@upi. UTR: TXN90002101"
      }
    ]
  },
  {
    "id": "PAY-1214",
    "farmerId": "F-103",
    "farmerName": "Mahesh Yadav",
    "date": "2026-07-11",
    "time": "07:30 am",
    "amount": 833.7,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "07:30 am",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "07:30 am",
        "description": "FAT: 4.1%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "07:30 am",
        "description": "Rate: \u20b959.55/L, Net: \u20b9833.7"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "07:30 am",
        "description": "Sent to Mahesh@upi. UTR: TXN90002102"
      }
    ]
  },
  {
    "id": "PAY-1220",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "date": "2026-07-10",
    "time": "07:30 am",
    "amount": 631.05,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "07:30 am",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "07:30 am",
        "description": "FAT: 4.2%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "07:30 am",
        "description": "Rate: \u20b960.1/L, Net: \u20b9631.05"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "07:30 am",
        "description": "Sent to name@upi. UTR: TXN90002200"
      }
    ]
  },
  {
    "id": "PAY-1222",
    "farmerId": "F-102",
    "farmerName": "Sandesh Kadam",
    "date": "2026-07-10",
    "time": "07:30 am",
    "amount": 751.25,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "07:30 am",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "07:30 am",
        "description": "FAT: 4.2%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "07:30 am",
        "description": "Rate: \u20b960.1/L, Net: \u20b9751.25"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "07:30 am",
        "description": "Sent to name@upi. UTR: TXN90002201"
      }
    ]
  },
  {
    "id": "PAY-1224",
    "farmerId": "F-103",
    "farmerName": "Mahesh Yadav",
    "date": "2026-07-10",
    "time": "07:30 am",
    "amount": 871.45,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "07:30 am",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "07:30 am",
        "description": "FAT: 4.2%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "07:30 am",
        "description": "Rate: \u20b960.1/L, Net: \u20b9871.45"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "07:30 am",
        "description": "Sent to Mahesh@upi. UTR: TXN90002202"
      }
    ]
  },
  {
    "id": "PAY-1230",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "date": "2026-07-09",
    "time": "07:30 am",
    "amount": 667.15,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "07:30 am",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "07:30 am",
        "description": "FAT: 4.3%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "07:30 am",
        "description": "Rate: \u20b960.65/L, Net: \u20b9667.15"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "07:30 am",
        "description": "Sent to name@upi. UTR: TXN90002300"
      }
    ]
  },
  {
    "id": "PAY-1232",
    "farmerId": "F-102",
    "farmerName": "Sandesh Kadam",
    "date": "2026-07-09",
    "time": "07:30 am",
    "amount": 788.45,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "07:30 am",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "07:30 am",
        "description": "FAT: 4.3%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "07:30 am",
        "description": "Rate: \u20b960.65/L, Net: \u20b9788.45"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "07:30 am",
        "description": "Sent to name@upi. UTR: TXN90002301"
      }
    ]
  },
  {
    "id": "PAY-1234",
    "farmerId": "F-103",
    "farmerName": "Mahesh Yadav",
    "date": "2026-07-09",
    "time": "07:30 am",
    "amount": 909.75,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "07:30 am",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "07:30 am",
        "description": "FAT: 4.3%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "07:30 am",
        "description": "Rate: \u20b960.65/L, Net: \u20b9909.75"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "07:30 am",
        "description": "Sent to Mahesh@upi. UTR: TXN90002302"
      }
    ]
  },
  {
    "id": "PAY-1240",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "date": "2026-07-08",
    "time": "07:30 am",
    "amount": 590,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "07:30 am",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "07:30 am",
        "description": "FAT: 4%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "07:30 am",
        "description": "Rate: \u20b959/L, Net: \u20b9590"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "07:30 am",
        "description": "Sent to name@upi. UTR: TXN90002400"
      }
    ]
  },
  {
    "id": "PAY-1242",
    "farmerId": "F-102",
    "farmerName": "Sandesh Kadam",
    "date": "2026-07-08",
    "time": "07:30 am",
    "amount": 708,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "07:30 am",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "07:30 am",
        "description": "FAT: 4%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "07:30 am",
        "description": "Rate: \u20b959/L, Net: \u20b9708"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "07:30 am",
        "description": "Sent to name@upi. UTR: TXN90002401"
      }
    ]
  },
  {
    "id": "PAY-1244",
    "farmerId": "F-103",
    "farmerName": "Mahesh Yadav",
    "date": "2026-07-08",
    "time": "07:30 am",
    "amount": 826,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "07:30 am",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "07:30 am",
        "description": "FAT: 4%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "07:30 am",
        "description": "Rate: \u20b959/L, Net: \u20b9826"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "07:30 am",
        "description": "Sent to Mahesh@upi. UTR: TXN90002402"
      }
    ]
  },
  {
    "id": "PAY-1250",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "date": "2026-07-07",
    "time": "07:30 am",
    "amount": 625.28,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "07:30 am",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "07:30 am",
        "description": "FAT: 4.1%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "07:30 am",
        "description": "Rate: \u20b959.55/L, Net: \u20b9625.28"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "07:30 am",
        "description": "Sent to name@upi. UTR: TXN90002500"
      }
    ]
  },
  {
    "id": "PAY-1252",
    "farmerId": "F-102",
    "farmerName": "Sandesh Kadam",
    "date": "2026-07-07",
    "time": "07:30 am",
    "amount": 744.38,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "07:30 am",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "07:30 am",
        "description": "FAT: 4.1%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "07:30 am",
        "description": "Rate: \u20b959.55/L, Net: \u20b9744.38"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "07:30 am",
        "description": "Sent to name@upi. UTR: TXN90002501"
      }
    ]
  },
  {
    "id": "PAY-1254",
    "farmerId": "F-103",
    "farmerName": "Mahesh Yadav",
    "date": "2026-07-07",
    "time": "07:30 am",
    "amount": 863.47,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "07:30 am",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "07:30 am",
        "description": "FAT: 4.1%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "07:30 am",
        "description": "Rate: \u20b959.55/L, Net: \u20b9863.47"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "07:30 am",
        "description": "Sent to Mahesh@upi. UTR: TXN90002502"
      }
    ]
  },
  {
    "id": "PAY-1260",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "date": "2026-07-06",
    "time": "07:30 am",
    "amount": 661.1,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "07:30 am",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "07:30 am",
        "description": "FAT: 4.2%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "07:30 am",
        "description": "Rate: \u20b960.1/L, Net: \u20b9661.1"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "07:30 am",
        "description": "Sent to name@upi. UTR: TXN90002600"
      }
    ]
  },
  {
    "id": "PAY-1262",
    "farmerId": "F-102",
    "farmerName": "Sandesh Kadam",
    "date": "2026-07-06",
    "time": "07:30 am",
    "amount": 781.3,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "07:30 am",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "07:30 am",
        "description": "FAT: 4.2%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "07:30 am",
        "description": "Rate: \u20b960.1/L, Net: \u20b9781.3"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "07:30 am",
        "description": "Sent to name@upi. UTR: TXN90002601"
      }
    ]
  },
  {
    "id": "PAY-1264",
    "farmerId": "F-103",
    "farmerName": "Mahesh Yadav",
    "date": "2026-07-06",
    "time": "07:30 am",
    "amount": 901.5,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "07:30 am",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "07:30 am",
        "description": "FAT: 4.2%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "07:30 am",
        "description": "Rate: \u20b960.1/L, Net: \u20b9901.5"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "07:30 am",
        "description": "Sent to Mahesh@upi. UTR: TXN90002602"
      }
    ]
  },
  {
    "id": "PAY-1270",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "date": "2026-07-05",
    "time": "07:30 am",
    "amount": 606.5,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "07:30 am",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "07:30 am",
        "description": "FAT: 4.3%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "07:30 am",
        "description": "Rate: \u20b960.65/L, Net: \u20b9606.5"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "07:30 am",
        "description": "Sent to name@upi. UTR: TXN90002700"
      }
    ]
  },
  {
    "id": "PAY-1272",
    "farmerId": "F-102",
    "farmerName": "Sandesh Kadam",
    "date": "2026-07-05",
    "time": "07:30 am",
    "amount": 727.8,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "07:30 am",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "07:30 am",
        "description": "FAT: 4.3%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "07:30 am",
        "description": "Rate: \u20b960.65/L, Net: \u20b9727.8"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "07:30 am",
        "description": "Sent to name@upi. UTR: TXN90002701"
      }
    ]
  },
  {
    "id": "PAY-1274",
    "farmerId": "F-103",
    "farmerName": "Mahesh Yadav",
    "date": "2026-07-05",
    "time": "07:30 am",
    "amount": 849.1,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "07:30 am",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "07:30 am",
        "description": "FAT: 4.3%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "07:30 am",
        "description": "Rate: \u20b960.65/L, Net: \u20b9849.1"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "07:30 am",
        "description": "Sent to Mahesh@upi. UTR: TXN90002702"
      }
    ]
  },
  {
    "id": "PAY-1280",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "date": "2026-07-04",
    "time": "07:30 am",
    "amount": 619.5,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "07:30 am",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "07:30 am",
        "description": "FAT: 4%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "07:30 am",
        "description": "Rate: \u20b959/L, Net: \u20b9619.5"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "07:30 am",
        "description": "Sent to name@upi. UTR: TXN90002800"
      }
    ]
  },
  {
    "id": "PAY-1282",
    "farmerId": "F-102",
    "farmerName": "Sandesh Kadam",
    "date": "2026-07-04",
    "time": "07:30 am",
    "amount": 737.5,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "07:30 am",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "07:30 am",
        "description": "FAT: 4%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "07:30 am",
        "description": "Rate: \u20b959/L, Net: \u20b9737.5"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "07:30 am",
        "description": "Sent to name@upi. UTR: TXN90002801"
      }
    ]
  },
  {
    "id": "PAY-1284",
    "farmerId": "F-103",
    "farmerName": "Mahesh Yadav",
    "date": "2026-07-04",
    "time": "07:30 am",
    "amount": 855.5,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "07:30 am",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "07:30 am",
        "description": "FAT: 4%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "07:30 am",
        "description": "Rate: \u20b959/L, Net: \u20b9855.5"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "07:30 am",
        "description": "Sent to Mahesh@upi. UTR: TXN90002802"
      }
    ]
  },
  {
    "id": "PAY-1290",
    "farmerId": "F-101",
    "farmerName": "Aditya Chavan",
    "date": "2026-07-03",
    "time": "07:30 am",
    "amount": 655.05,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "07:30 am",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "07:30 am",
        "description": "FAT: 4.1%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "07:30 am",
        "description": "Rate: \u20b959.55/L, Net: \u20b9655.05"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "07:30 am",
        "description": "Sent to name@upi. UTR: TXN90002900"
      }
    ]
  },
  {
    "id": "PAY-1292",
    "farmerId": "F-102",
    "farmerName": "Sandesh Kadam",
    "date": "2026-07-03",
    "time": "07:30 am",
    "amount": 774.15,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "07:30 am",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "07:30 am",
        "description": "FAT: 4.1%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "07:30 am",
        "description": "Rate: \u20b959.55/L, Net: \u20b9774.15"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "07:30 am",
        "description": "Sent to name@upi. UTR: TXN90002901"
      }
    ]
  },
  {
    "id": "PAY-1294",
    "farmerId": "F-103",
    "farmerName": "Mahesh Yadav",
    "date": "2026-07-03",
    "time": "07:30 am",
    "amount": 893.25,
    "status": "Success",
    "timeline": [
      {
        "label": "Milk Received",
        "status": "completed",
        "time": "07:30 am",
        "description": "Logged at Kolhapur, Maharashtra hub."
      },
      {
        "label": "Quality Analysis",
        "status": "completed",
        "time": "07:30 am",
        "description": "FAT: 4.1%, SNF: 8.5%"
      },
      {
        "label": "Pricing Calculated",
        "status": "completed",
        "time": "07:30 am",
        "description": "Rate: \u20b959.55/L, Net: \u20b9893.25"
      },
      {
        "label": "Bank Transfer",
        "status": "completed",
        "time": "07:30 am",
        "description": "Sent to Mahesh@upi. UTR: TXN90002902"
      }
    ]
  }
];

export const mockBranches: Branch[] = [
  {
    "id": "MAIN-01",
    "name": "3T Dairy Sangamner Primary Center",
    "manager": "Sandesh Kadam",
    "capacity": 20000,
    "todayCollection": 250,
    "employees": 4,
    "payments": 42,
    "status": "Active",
    "x": 48,
    "y": 48
  }
];

export const mockCollectionCalendar = [
  { date: "2026-08-01", shift: "Morning", volume: 1450, avgFat: 4.3, avgSnf: 8.5, farmers: 42 },
  { date: "2026-08-01", shift: "Evening", volume: 1380, avgFat: 4.2, avgSnf: 8.6, farmers: 39 },
  { date: "2026-08-02", shift: "Morning", volume: 1490, avgFat: 4.4, avgSnf: 8.5, farmers: 44 },
  { date: "2026-08-02", shift: "Evening", volume: 1410, avgFat: 4.3, avgSnf: 8.5, farmers: 41 },
  { date: "2026-08-03", shift: "Morning", volume: 1520, avgFat: 4.2, avgSnf: 8.7, farmers: 45 },
  { date: "2026-08-03", shift: "Evening", volume: 1460, avgFat: 4.3, avgSnf: 8.6, farmers: 43 }
];
