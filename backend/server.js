const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const Joi = require('joi');
const crypto = require('crypto');
const cors = require('cors');
require('dotenv').config();

const app = express();

// 1. Helmet: Secure HTTP Headers
app.use(helmet());

// Cors setup
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Capture raw body for HMAC signature verification on webhook routes
app.use(express.json({
  verify: (req, res, buf) => {
    if (req.originalUrl.startsWith('/api/webhooks')) {
      req.rawBody = buf;
    }
  }
}));

// 2. MongoDB connection setup
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/threet';
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to secure database.');
    seedDatabase();
  })
  .catch((err) => console.error('Database connection failure:', err.message));

// Schemas & Models
const FarmerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  village: { type: String, required: true },
  animals: { type: Number, default: 0 },
  aadhaar: { type: String, required: true, unique: true },
  bankAccount: { type: String, required: true },
  ifsc: { type: String, required: true },
  upiId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const CollectionSchema = new mongoose.Schema({
  farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Farmer', required: true },
  farmerName: { type: String, required: true },
  village: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  weight: { type: Number, required: true },
  fat: { type: Number, required: true },
  snf: { type: Number, required: true },
  rate: { type: Number, required: true },
  total: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

const PayoutSchema = new mongoose.Schema({
  farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Farmer', required: true },
  amount: { type: Number, required: true },
  payoutId: { type: String, required: true, unique: true },
  status: { type: String, enum: ['Pending', 'Success', 'Failed'], default: 'Pending' },
  utr: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const Farmer = mongoose.model('Farmer', FarmerSchema);
const Collection = mongoose.model('Collection', CollectionSchema);
const Payout = mongoose.model('Payout', PayoutSchema);

// Seeding Script (runs automatically on empty database setup)
async function seedDatabase() {
  try {
    const count = await Farmer.countDocuments({});
    if (count === 0) {
      console.log('Seeding initial Marathi farmers data into MongoDB...');
      const seededFarmers = await Farmer.insertMany([
        {
          name: 'Ramesh Kadam',
          village: 'Kolhapur, Maharashtra',
          phone: '+91 98250 14892',
          animals: 12,
          aadhaar: '111122223333',
          bankAccount: '98250148921',
          ifsc: 'SBIN0001041',
          upiId: 'ramesh@okaxis'
        },
        {
          name: 'Sunita Gawade',
          village: 'Sangli, Maharashtra',
          phone: '+91 94270 29311',
          animals: 8,
          aadhaar: '222233334444',
          bankAccount: '94270293111',
          ifsc: 'SBIN0001042',
          upiId: 'sunita@okaxis'
        },
        {
          name: 'Sanjay Patil',
          village: 'Satara, Maharashtra',
          phone: '+91 91150 49102',
          animals: 22,
          aadhaar: '333344445555',
          bankAccount: '91150491021',
          ifsc: 'SBIN0001043',
          upiId: 'sanjay@okaxis'
        },
        {
          name: 'Dnyaneshwar More',
          village: 'Pune, Maharashtra',
          phone: '+91 97268 83120',
          animals: 5,
          aadhaar: '444455556666',
          bankAccount: '97268831201',
          ifsc: 'SBIN0001044',
          upiId: 'dnyaneshwar@okaxis'
        },
        {
          name: 'Baburao Deshmukh',
          village: 'Ahmednagar, Maharashtra',
          phone: '+91 99041 33280',
          animals: 9,
          aadhaar: '555566667777',
          bankAccount: '99041332801',
          ifsc: 'SBIN0001045',
          upiId: 'baburao@okaxis'
        }
      ]);

      const ramesh = seededFarmers[0];
      const sunita = seededFarmers[1];
      const sanjay = seededFarmers[2];
      const dnyaneshwar = seededFarmers[3];
      const baburao = seededFarmers[4];

      console.log('Seeding initial delivery and payouts history...');
      await Collection.insertMany([
        { farmerId: ramesh._id, farmerName: ramesh.name, village: ramesh.village, date: '2026-07-11', time: 'Morning', weight: 14.8, fat: 4.5, snf: 8.8, rate: 49.75, total: 736.3 },
        { farmerId: sunita._id, farmerName: sunita.name, village: sunita.village, date: '2026-07-11', time: 'Morning', weight: 10.2, fat: 4.1, snf: 8.5, rate: 47.1, total: 480.4 },
        { farmerId: sanjay._id, farmerName: sanjay.name, village: sanjay.village, date: '2026-07-11', time: 'Morning', weight: 28.5, fat: 3.9, snf: 8.5, rate: 46.0, total: 1311.0 },
        { farmerId: dnyaneshwar._id, farmerName: dnyaneshwar.name, village: dnyaneshwar.village, date: '2026-07-11', time: 'Morning', weight: 7.4, fat: 4.8, snf: 9.1, rate: 54.2, total: 401.1 },
        { farmerId: baburao._id, farmerName: baburao.name, village: baburao.village, date: '2026-07-11', time: 'Morning', weight: 11.8, fat: 4.4, snf: 8.7, rate: 51.2, total: 604.2 }
      ]);

      await Payout.insertMany([
        { farmerId: ramesh._id, amount: 736.3, payoutId: 'pout_txn89182390', status: 'Success', utr: '3T89182390' },
        { farmerId: sunita._id, amount: 480.4, payoutId: 'pout_txn89182391', status: 'Success', utr: '3T89182391' },
        { farmerId: sanjay._id, amount: 1311.0, payoutId: 'pout_txn89182392', status: 'Success', utr: '3T89182392' },
        { farmerId: dnyaneshwar._id, amount: 401.1, payoutId: 'pout_txn89182393', status: 'Success', utr: '3T89182393' }
      ]);
      console.log('Seeding finished successfully.');
    }
  } catch (err) {
    console.error('Error seeding data:', err.message);
  }
}

// 3. Rate-Limiting: Max 5 payout requests per minute per IP to prevent drain attacks
const payoutLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5,
  message: {
    error: 'Too many payment requests from this IP. Please try again after a minute.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 4. Joi Input Validation Schema (Hacker-proof sanitization to block NoSQL Injections)
const payoutValidationSchema = Joi.object({
  name: Joi.string().min(3).max(50).pattern(/^[a-zA-Z\s]+$/).required()
    .messages({ 'string.pattern.base': 'Name must contain only alphabetic characters and spaces.' }),
  phone: Joi.string().pattern(/^\+91\s\d{5}\s\d{5}$|^\d{10}$/).required()
    .messages({ 'string.pattern.base': 'Please enter a valid phone number (+91 XXXXX XXXXX or 10 digits).' }),
  village: Joi.string().min(3).max(50).required(),
  animals: Joi.number().integer().min(0).max(1000).required(),
  aadhaar: Joi.string().length(12).pattern(/^\d{12}$/).required()
    .messages({ 'string.pattern.base': 'Aadhaar must be exactly 12 numeric digits.' }),
  bankAccount: Joi.string().min(8).max(18).pattern(/^\d+$/).required()
    .messages({ 'string.pattern.base': 'Bank Account must be between 8 to 18 digits.' }),
  ifsc: Joi.string().length(11).pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/).required()
    .messages({ 'string.pattern.base': 'IFSC Code format is invalid (e.g. SBIN0001234).' }),
  upiId: Joi.string().pattern(/^[\w.-]+@[\w.-]+$/).required()
    .messages({ 'string.pattern.base': 'Invalid UPI ID format (e.g. name@upi).' }),
  amount: Joi.number().positive().min(1).max(50000).required()
});

// 5. GET Routes to expose Database items to Frontend
app.get('/api/farmers', async (req, res) => {
  try {
    const list = await Farmer.find({});
    return res.status(200).json(list);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve farmers.' });
  }
});

app.get('/api/collections', async (req, res) => {
  try {
    const list = await Collection.find({});
    return res.status(200).json(list);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve collection history.' });
  }
});

app.get('/api/payments', async (req, res) => {
  try {
    const list = await Payout.find({});
    return res.status(200).json(list);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve payment settlements.' });
  }
});

// 6. POST Route to process instant payouts
app.post('/api/pay-farmer', payoutLimiter, async (req, res) => {
  const { error, value } = payoutValidationSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  try {
    let farmer = await Farmer.findOne({ aadhaar: value.aadhaar });
    if (!farmer) {
      farmer = new Farmer({
        name: value.name,
        phone: value.phone,
        village: value.village,
        animals: value.animals,
        aadhaar: value.aadhaar,
        bankAccount: value.bankAccount,
        ifsc: value.ifsc,
        upiId: value.upiId
      });
      await farmer.save();
    }

    const payoutApiKey = process.env.PAYOUT_API_KEY;
    const payoutSecret = process.env.PAYOUT_SECRET;
    const generatedPayoutId = 'pout_' + crypto.randomBytes(8).toString('hex');

    if (!payoutApiKey || !payoutSecret) {
      // Simulation mode
      const mockPayout = new Payout({
        farmerId: farmer._id,
        amount: value.amount,
        payoutId: generatedPayoutId,
        status: 'Pending'
      });
      await mockPayout.save();

      return res.status(202).json({
        message: 'Payout request initiated successfully (Simulation Mode).',
        payoutId: generatedPayoutId,
        status: 'Pending'
      });
    }

    const authHeader = Buffer.from(`${payoutApiKey}:${payoutSecret}`).toString('base64');
    const response = await fetch('https://api.razorpay.com/v1/payouts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${authHeader}`
      },
      body: JSON.stringify({
        account_number: process.env.PAYOUT_ACCOUNT_NUMBER,
        amount: Math.round(value.amount * 100),
        currency: 'INR',
        mode: 'UPI',
        purpose: 'payout',
        fund_account: {
          contact: {
            name: farmer.name,
            contact: farmer.phone.replace(/\s+/g, '')
          },
          account_type: 'vpa',
          vpa: { address: farmer.upiId }
        },
        reference_id: generatedPayoutId
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error ? data.error.description : 'Failed to call Razorpay API.');
    }

    const payoutRecord = new Payout({
      farmerId: farmer._id,
      amount: value.amount,
      payoutId: data.id,
      status: 'Pending'
    });
    await payoutRecord.save();

    return res.status(202).json({
      message: 'Payout request sent to bank gateway.',
      payoutId: data.id,
      status: 'Pending'
    });

  } catch (err) {
    console.error('Payout failure:', err.message);
    return res.status(500).json({ error: 'System failed to dispatch payout. Please contact administrator.' });
  }
});

// 7. HMAC Signature Webhook: Mathematically validates callbacks from payment gateway
app.post('/api/webhooks/payout', (req, res) => {
  const webhookSecret = process.env.WEBHOOK_SECRET;

  if (!webhookSecret) {
    return res.status(500).json({ error: 'Webhook secret is not configured.' });
  }

  const signature = req.headers['x-razorpay-signature'];
  if (!signature) {
    return res.status(401).json({ error: 'Webhook signature missing.' });
  }

  const hmac = crypto.createHmac('sha256', webhookSecret);
  hmac.update(req.rawBody);
  const expectedSignature = hmac.digest('hex');

  if (signature !== expectedSignature) {
    console.warn('Webhook signature mismatch detected!');
    return res.status(400).json({ error: 'Webhook signature validation failed.' });
  }

  const event = req.body.event;
  const payoutData = req.body.payload.payout.entity;

  console.log(`Verified Webhook: Event [${event}] for Payout ID [${payoutData.id}]`);

  let status = 'Pending';
  if (event === 'payout.processed') {
    status = 'Success';
  } else if (event === 'payout.failed' || event === 'payout.rejected') {
    status = 'Failed';
  }

  Payout.findOneAndUpdate(
    { payoutId: payoutData.id },
    { status: status, utr: payoutData.utr },
    { new: true }
  ).then(record => {
    if (record) {
      console.log(`Database transaction updated: Payout ${record.payoutId} is now ${status}.`);
    }
  }).catch(err => {
    console.error('Error updating webhook transaction status:', err.message);
  });

  return res.status(200).json({ status: 'ok' });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Secure Payout server listening on port ${PORT}`);
});
