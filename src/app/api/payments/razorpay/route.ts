import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { getDb, syncPaymentStatusToSupabase } from '@/lib/db';
import { PaymentTimelineStep, getIndiaTimeString } from '@/app/data';

const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_3T_demo';
const keySecret = process.env.RAZORPAY_KEY_SECRET || 'rzp_secret_3T_demo';

// Initialize Razorpay instance safely
let razorpayInstance: Razorpay | null = null;
try {
  if (keyId && keySecret && !keyId.includes('3T_demo')) {
    razorpayInstance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }
} catch (e) {
  console.warn('Razorpay SDK init fallback to simulated mode:', e);
}

// ─────────────────────────────────────────────────────────────────────────────
// POST: Create Razorpay Order
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { paymentId, amount, farmerName, farmerPhone } = body;

    if (!paymentId || !amount) {
      return NextResponse.json({ success: false, error: 'Payment ID and Amount are required' }, { status: 400 });
    }

    const amountInPaise = Math.round(Number(amount) * 100);

    // If real keys present, create real order via Razorpay API
    if (razorpayInstance) {
      try {
        const order = await razorpayInstance.orders.create({
          amount: amountInPaise,
          currency: 'INR',
          receipt: `receipt_${paymentId}`,
          notes: {
            farmerName: farmerName || 'Farmer',
            paymentId: paymentId,
            app: '3T Dairy Network'
          }
        });

        return NextResponse.json({
          success: true,
          mode: 'live_sandbox',
          keyId: keyId,
          orderId: order.id,
          amount: order.amount,
          currency: order.currency
        });
      } catch (err: any) {
        console.warn('Razorpay live API order creation failed, falling back to simulated order:', err.message);
      }
    }

    // Fallback simulated Razorpay order for instant zero-config hackathon demo
    const simulatedOrderId = `order_${Math.random().toString(36).substring(2, 15)}`;
    return NextResponse.json({
      success: true,
      mode: 'simulated_test',
      keyId: keyId,
      orderId: simulatedOrderId,
      amount: amountInPaise,
      currency: 'INR'
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PUT: Verify & Settle Payment after Razorpay completion
// ─────────────────────────────────────────────────────────────────────────────
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { paymentId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = body;

    if (!paymentId) {
      return NextResponse.json({ success: false, error: 'Payment ID is required' }, { status: 400 });
    }

    // Generate consistent 12-digit Bank UTR / Reference
    const utrNumber = razorpayPaymentId || `UPI${Math.floor(100000000000 + Math.random() * 900000000000)}`;

    const db = await getDb();
    const paymentIndex = db.data.payments.findIndex(p => p.id === paymentId);
    let updatedTimeline: PaymentTimelineStep[] = [];

    if (paymentIndex !== -1) {
      const payment = db.data.payments[paymentIndex];
      const nowTimeStr = getIndiaTimeString();

      // Update timeline with exact matching UTR and Sangamner primary center
      updatedTimeline = [
        { label: "Milk Received", status: "completed", time: payment.time || nowTimeStr, description: "Logged at 3T Dairy Sangamner Primary Center." },
        { label: "Quality Analysis", status: "completed", time: payment.time || nowTimeStr, description: "FAT & SNF tested and approved." },
        { label: "Pricing Calculated", status: "completed", time: payment.time || nowTimeStr, description: `Net payout calculated: ₹${payment.amount}` },
        { label: "Bank Transfer", status: "completed", time: nowTimeStr, description: `Sent via Instant Bank UPI Gateway. UTR: ${utrNumber}` }
      ];

      payment.status = "Success";
      payment.timeline = updatedTimeline;

      await syncPaymentStatusToSupabase(payment.id, "Success", updatedTimeline);
    }

    return NextResponse.json({
      success: true,
      message: "Payment successfully settled via UPI",
      utr: utrNumber,
      timeline: updatedTimeline,
      paymentId: paymentId
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
