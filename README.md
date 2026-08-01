# 📸 Robin-App — Express.js Backend Server

> **Production-grade REST API for a Photography Studio booking platform**  
> Built with Node.js · Express · MongoDB · Mongoose · Socket.IO · Razorpay

---

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Folder Structure](#folder-structure)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Authentication Flow](#authentication-flow)
- [Payment Integration](#payment-integration)
- [Real-Time Chat](#real-time-chat)
- [Middleware Stack](#middleware-stack)
- [Environment Variables](#environment-variables)
- [Quick Start](#quick-start)
- [Implementation Roadmap](#implementation-roadmap)
- [Security Checklist](#security-checklist)

---

## Overview

The Robin App backend provides all the server-side functionality for a React Native / Expo mobile app. It replaces every mocked API with real, secure, production-ready endpoints covering:

- 🔐 JWT authentication with refresh token rotation
- 📅 Photography service browsing & session booking
- 💳 Razorpay payment gateway (create order → checkout → verify)
- 💬 Real-time support chat via Socket.IO
- 👤 User profile & image upload (Cloudinary)
- 📧 Email notifications via Nodemailer

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Runtime | Node.js 20 LTS | Non-blocking I/O |
| Framework | Express.js 4.x | HTTP routing |
| Database | MongoDB | NoSQL document store |
| ODM | Mongoose 8.x | Schema modelling & queries |
| Auth | JWT + bcryptjs | Stateless auth, secure password hashing |
| Real-time | Socket.IO 4.x | WebSocket chat |
| Payments | Razorpay Node SDK | Payment gateway |
| File Storage | Cloudinary | Portfolio & avatar images |
| Email | Nodemailer | Booking confirmations, OTPs |
| Validation | Joi / express-validator | Runtime schema validation |
| Logging | Morgan | HTTP access logging |

---

## Folder Structure

```
robin-backend/
├── src/
│   ├── config/
│   │   ├── db.js               # Mongoose connection
│   │   ├── razorpay.js         # Razorpay SDK init
│   │   └── cloudinary.js       # Cloudinary config
│   ├── models/
│   │   ├── User.js
│   │   ├── RefreshToken.js
│   │   ├── PhotoService.js
│   │   ├── Package.js
│   │   ├── Booking.js
│   │   ├── Payment.js
│   │   └── ChatMessage.js
│   ├── features/
│   │   ├── auth/
│   │   │   ├── auth.routes.js
│   │   │   ├── auth.controller.js
│   │   │   └── auth.service.js
│   │   ├── services/
│   │   │   ├── services.routes.js
│   │   │   ├── services.controller.js
│   │   │   └── services.service.js
│   │   ├── bookings/
│   │   │   ├── bookings.routes.js
│   │   │   ├── bookings.controller.js
│   │   │   └── bookings.service.js
│   │   ├── payments/
│   │   │   ├── payments.routes.js
│   │   │   ├── payments.controller.js
│   │   │   └── payments.service.js
│   │   ├── chat/
│   │   │   ├── chat.routes.js
│   │   │   ├── chat.controller.js
│   │   │   └── chat.service.js
│   │   └── profile/
│   │       ├── profile.routes.js
│   │       ├── profile.controller.js
│   │       └── profile.service.js
│   ├── middleware/
│   │   ├── authenticate.js     # JWT verification
│   │   ├── authorize.js        # Role-based guards
│   │   ├── errorHandler.js     # Global error handler
│   │   └── upload.js           # Multer + Cloudinary
│   ├── utils/
│   │   ├── jwt.js              # Sign / verify tokens
│   │   ├── hash.js             # bcrypt helpers
│   │   ├── apiResponse.js      # Standard response shape
│   │   └── mailer.js           # Nodemailer helper
│   ├── socket/
│   │   └── socketServer.js     # Socket.IO init & namespaces
│   └── app.js                  # Express app factory
├── .env.example
├── package.json
└── server.js                   # HTTP server entry point
```

---

## Database Schema

All collections are defined using Mongoose schemas.

### User

```js
// src/models/User.js
const userSchema = new mongoose.Schema({
  name:            { type: String, required: true },
  email:           { type: String, required: true, unique: true },
  phone:           { type: String, unique: true, sparse: true },
  passwordHash:    { type: String, required: true },
  role:            { type: String, enum: ['CUSTOMER', 'ADMIN'], default: 'CUSTOMER' },
  avatarUrl:       String,
  isEmailVerified: { type: Boolean, default: false },
}, { timestamps: true });
```

### PhotoService

```js
const photoServiceSchema = new mongoose.Schema({
  slug:        { type: String, required: true, unique: true },
  category:    { type: String, enum: ['WEDDING', 'PORTRAIT', 'EVENT', 'CORPORATE', 'OTHER'] },
  title:       { type: String, required: true },
  description: String,
  coverImage:  String,
  isActive:    { type: Boolean, default: true },
}, { timestamps: true });
```

### Booking

```js
const bookingSchema = new mongoose.Schema({
  userId:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  serviceId:     { type: mongoose.Schema.Types.ObjectId, ref: 'PhotoService', required: true },
  packageId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Package', required: true },
  status:        { type: String, enum: ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'], default: 'PENDING' },
  scheduledDate: { type: Date, required: true },
  venue:         { type: String, required: true },
  specialNotes:  String,
  totalAmount:   { type: Number, required: true },
}, { timestamps: true });
```

### Payment

```js
const paymentSchema = new mongoose.Schema({
  bookingId:          { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
  razorpayOrderId:    { type: String, required: true, unique: true },
  razorpayPaymentId:  String,
  razorpaySignature:  String,
  status:             { type: String, enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'], default: 'PENDING' },
  amount:             { type: Number, required: true },
  currency:           { type: String, default: 'INR' },
}, { timestamps: true });
```

### ChatMessage

```js
const chatMessageSchema = new mongoose.Schema({
  senderId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  roomId:      { type: String, required: true },
  content:     { type: String, required: true },
  messageType: { type: String, enum: ['TEXT', 'IMAGE', 'FILE'], default: 'TEXT' },
  isRead:      { type: Boolean, default: false },
}, { timestamps: true });
```

---

## API Endpoints

### 🔐 Authentication — `/api/v1/auth`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/register` | No | Register new user |
| `POST` | `/login` | No | Email + password → access + refresh token |
| `POST` | `/refresh` | No | Rotate refresh token, issue new access token |
| `POST` | `/logout` | Yes | Invalidate refresh token |
| `POST` | `/forgot-password` | No | Send OTP/reset link to email |
| `POST` | `/reset-password` | No | Verify OTP, update password |
| `GET` | `/verify-email/:token` | No | Verify email from registration link |

### 📷 Photography Services — `/api/v1/services`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/` | No | List all active services |
| `GET` | `/:slug` | No | Get service with package details |
| `GET` | `/:slug/packages` | No | Get all pricing packages |
| `POST` | `/` | Admin | Create a new service |
| `PUT` | `/:id` | Admin | Update service details |
| `DELETE` | `/:id` | Admin | Soft delete (isActive = false) |

### 📅 Bookings — `/api/v1/bookings`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/` | Customer | List user's bookings |
| `POST` | `/` | Customer | Create a new booking |
| `GET` | `/:id` | Yes | Get booking detail |
| `PUT` | `/:id/cancel` | Customer | Cancel a pending booking |
| `GET` | `/admin/all` | Admin | All bookings with filters |
| `PUT` | `/admin/:id/status` | Admin | Update booking status |

### 💳 Payments — `/api/v1/payments`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/create-order` | Yes | Create Razorpay order |
| `POST` | `/verify` | Yes | Verify HMAC signature, update DB |
| `POST` | `/webhook` | Sig only | Razorpay async event handler |
| `GET` | `/:bookingId` | Yes | Get payment details |
| `POST` | `/:id/refund` | Admin | Initiate refund |

### 💬 Chat — `/api/v1/chat`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/rooms` | Yes | List chat rooms for current user |
| `GET` | `/rooms/:roomId/messages` | Yes | Fetch paginated message history |
| `POST` | `/rooms/:roomId/messages` | Yes | Send a message |
| `PUT` | `/rooms/:roomId/read` | Yes | Mark messages as read |

### 👤 Profile — `/api/v1/profile`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/` | Yes | Get authenticated user's profile |
| `PUT` | `/` | Yes | Update name, phone |
| `PUT` | `/password` | Yes | Change password |
| `PUT` | `/avatar` | Yes | Upload avatar to Cloudinary |
| `DELETE` | `/` | Yes | Delete account |

---

## Authentication Flow

### JWT Dual Token Strategy

```
Access Token  → 15 minutes lifetime  → sent in Authorization: Bearer header
Refresh Token → 7 days lifetime      → stored in DB, sent in httpOnly cookie
```

```js
// src/utils/jwt.js
const jwt = require('jsonwebtoken');

const generateTokens = (userId, role) => {
  const accessToken = jwt.sign(
    { sub: userId, role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: '15m' }
  );
  const refreshToken = jwt.sign(
    { sub: userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
  return { accessToken, refreshToken };
};

module.exports = { generateTokens };
```

### Auth Middleware

```js
// src/middleware/authenticate.js
const jwt = require('jsonwebtoken');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = { id: decoded.sub, role: decoded.role };
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

module.exports = { authenticate };
```

### Refresh Token Rotation

> On every `/auth/refresh` call:
> 1. Old refresh token is **deleted** from MongoDB
> 2. A brand-new refresh token is **generated and stored** (hashed)
> 3. If an attacker uses a stolen token first → legitimate user's next refresh **fails** → forced re-login detects theft

---

## Payment Integration

### Three-Step Razorpay Flow

```
1. POST /payments/create-order
   └── Server creates Razorpay order, stores orderId in MongoDB
   └── Returns { orderId, amount, currency, keyId } to app

2. App opens Razorpay checkout SDK
   └── User pays → Razorpay returns { paymentId, signature }

3. POST /payments/verify
   └── Server computes HMAC-SHA256: orderId|paymentId
   └── Compares with received signature
   └── On match → Payment.status = PAID, Booking.status = CONFIRMED
```

```js
// src/features/payments/payments.service.js
const crypto = require('crypto');
const razorpay = require('../../config/razorpay');
const Payment = require('../../models/Payment');
const Booking = require('../../models/Booking');

const createOrder = async (bookingId, userId) => {
  const booking = await Booking.findOne({ _id: bookingId, userId });
  if (!booking) throw new Error('Booking not found');

  const amountPaise = Math.round(booking.totalAmount * 100);
  const order = await razorpay.orders.create({
    amount: amountPaise,
    currency: 'INR',
    receipt: `booking_${bookingId}`,
  });

  await Payment.create({ bookingId, razorpayOrderId: order.id, amount: booking.totalAmount });
  return order;
};

const verifyPayment = async ({ orderId, paymentId, signature }) => {
  const body = `${orderId}|${paymentId}`;
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');

  if (expected !== signature) throw new Error('Payment signature mismatch');

  await Payment.findOneAndUpdate(
    { razorpayOrderId: orderId },
    { razorpayPaymentId: paymentId, razorpaySignature: signature, status: 'PAID' }
  );
  await Booking.findOneAndUpdate(
    { _id: (await Payment.findOne({ razorpayOrderId: orderId })).bookingId },
    { status: 'CONFIRMED' }
  );

  return { success: true };
};

module.exports = { createOrder, verifyPayment };
```

---

## Real-Time Chat

```js
// src/socket/socketServer.js
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const chatService = require('../features/chat/chat.service');

const initSocketServer = (httpServer) => {
  const io = new Server(httpServer, {
    cors: { origin: process.env.ALLOWED_ORIGINS?.split(',') },
    transports: ['websocket', 'polling'],
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      socket.userId = decoded.sub;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    const roomId = `support_${socket.userId}`;
    socket.join(roomId);

    socket.on('chat:send', async (data) => {
      const message = await chatService.saveMessage({
        senderId: socket.userId,
        roomId,
        content: data.content,
        messageType: data.type ?? 'TEXT',
      });
      io.to(roomId).emit('chat:receive', message);
    });

    socket.on('disconnect', () => {
      console.log(`User ${socket.userId} disconnected`);
    });
  });

  return io;
};

module.exports = { initSocketServer };
```

### React Native Client Connection

```js
import { io } from 'socket.io-client';

const socket = io('https://api.yourdomain.com', {
  auth: { token: accessToken },
  transports: ['websocket'],
});

socket.on('chat:receive', (message) => {
  setMessages(prev => [...prev, message]);
});

const sendMessage = (text) => {
  socket.emit('chat:send', { content: text, type: 'TEXT' });
};
```

---

## Middleware Stack

Execution order for every request:

```
Request
  │
  ├── 1. helmet()           → Secure HTTP headers (CSP, HSTS, X-Frame-Options…)
  ├── 2. cors()             → Whitelist mobile app origins
  ├── 3. express.json()     → Parse JSON request body
  ├── 4. cookieParser()     → Parse httpOnly refresh token cookie
  ├── 5. morgan()           → HTTP access logging
  ├── 6. authenticate       → Verify JWT (protected routes only)
  ├── 7. authorize(role)    → Check ADMIN role (admin routes only)
  ├── 8. Route Handler      → Controller → Service → MongoDB
  │
  └── 9. errorHandler       → Catch-all, send structured JSON error
```

### Global Error Handler

```js
// src/middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode ?? 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = { errorHandler };
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in your values.

```env
# .env.example

# ── Server ───────────────────────────────────────────
NODE_ENV=development
PORT=5000
ALLOWED_ORIGINS=http://localhost:8081,exp://192.168.1.x

# ── MongoDB ──────────────────────────────────────────
MONGO_URI=mongodb://localhost:27017/robin_db

# ── JWT ──────────────────────────────────────────────
JWT_ACCESS_SECRET=your_super_secret_access_key_min_32_chars
JWT_REFRESH_SECRET=your_super_secret_refresh_key_min_32_chars

# ── Razorpay ─────────────────────────────────────────
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# ── Email (Nodemailer) ────────────────────────────────
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
FROM_EMAIL=noreply@robinstudio.com

# ── File Storage (Cloudinary) ────────────────────────
CLOUDINARY_CLOUD_NAME=your_cloud
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
```

---

## Quick Start

```bash
# 1. Clone and install
git clone https://github.com/yourname/robin-backend.git
cd robin-backend
npm install

# 2. Configure environment
cp .env.example .env
# → Fill in your MONGO_URI, JWT secrets, Razorpay keys, etc.

# 3. Make sure MongoDB is running locally
mongod --dbpath /your/db/path

# 4. Start development server
npm run dev

# 5. Test it
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@robin.com","password":"Test@1234"}'
```

### Scripts

```bash
npm run dev       # Start with nodemon (hot reload)
npm start         # Start production server
npm test          # Run test suite
```

---

## Implementation Roadmap

### Phase 1 — Foundation
- [ ] `npm init` — install dependencies, configure ESLint + Prettier
- [ ] Set up `config/db.js` Mongoose connection
- [ ] Define all Mongoose models
- [ ] Set up `app.js` with helmet, cors, morgan, body-parser, error handler

### Phase 2 — Authentication
- [ ] Register, login, logout, refresh endpoints
- [ ] Email verification + forgot/reset password
- [ ] `authenticate` and `authorize` middleware

### Phase 3 — Core Features
- [ ] Services CRUD (public + admin)
- [ ] Bookings endpoints with validation
- [ ] Razorpay: create order → verify payment → webhook handler
- [ ] Profile endpoints + Cloudinary upload middleware

### Phase 4 — Real-Time
- [ ] Socket.IO server with JWT auth + chat namespace
- [ ] Nodemailer booking confirmation emails

### Phase 5 — QA & Deployment
- [ ] Test suite (unit + integration)
- [ ] Deploy to VPS / Railway / Render, configure SSL
- [ ] Update React Native app: replace mocks with real BASE_URL

---

## Security Checklist

| Control | Implementation | Status |
|---------|---------------|--------|
| NoSQL Injection | Mongoose sanitized queries | ✅ Required |
| Password Storage | bcrypt cost factor 12 | ✅ Required |
| JWT Secret | Minimum 256-bit random secret | ✅ Required |
| Refresh Token | Stored hashed, deleted on use | ✅ Required |
| HTTP Headers | Helmet.js (CSP, HSTS, X-Frame-Options…) | ✅ Required |
| Payment Signature | HMAC-SHA256 Razorpay verification | ✅ Required |
| Input Validation | Joi / express-validator on all inputs | ✅ Required |
| CORS Policy | Whitelist only known app origins | ✅ Required |
| Error Info Leak | Stack traces hidden in production | ✅ Required |
| HTTPS | TLS at reverse proxy (Nginx / Caddy) | ✅ Required |
| Secrets | Env vars via `.env`, never in Git | ✅ Required |

---

> Built for **Robin Photo Studio** · Express.js + MongoDB + Socket.IO + Razorpay  
> Replace every mock in your React Native app with this production-ready backend.
