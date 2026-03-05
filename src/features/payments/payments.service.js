const crypto = require('crypto');
const razorpay = require('../../config/razorpay');
const Payment = require('../../models/Payment');
const Booking = require('../../models/Booking');
const { AppError } = require('../../utils/apiResponse');

const createOrder = async (bookingId, userId) => {
  const booking = await Booking.findOne({ _id: bookingId, userId });
  if (!booking) throw new AppError('Booking not found', 404);
  if (booking.status === 'CANCELLED') throw new AppError('Cannot pay for a cancelled booking', 400);

  const existing = await Payment.findOne({ bookingId });
  if (existing && existing.status === 'PAID') throw new AppError('Booking already paid', 400);

  const amountPaise = Math.round(booking.totalAmount * 100);
  const order = await razorpay.orders.create({
    amount: amountPaise,
    currency: 'INR',
    receipt: `booking_${bookingId}`,
    notes: { bookingId: bookingId.toString(), userId: userId.toString() },
  });

  // Upsert payment record
  await Payment.findOneAndUpdate(
    { bookingId },
    { razorpayOrderId: order.id, amount: booking.totalAmount, status: 'PENDING' },
    { upsert: true, new: true }
  );

  return { orderId: order.id, amount: order.amount, currency: order.currency, keyId: process.env.RAZORPAY_KEY_ID };
};

const verifyPayment = async ({ orderId, paymentId, signature }) => {
  const body = `${orderId}|${paymentId}`;
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');

  if (expected !== signature) throw new AppError('Payment signature mismatch', 400);

  const payment = await Payment.findOneAndUpdate(
    { razorpayOrderId: orderId },
    { razorpayPaymentId: paymentId, razorpaySignature: signature, status: 'PAID' },
    { new: true }
  );
  if (!payment) throw new AppError('Payment record not found', 404);

  await Booking.findByIdAndUpdate(payment.bookingId, { status: 'CONFIRMED' });

  return { success: true };
};

const handleWebhook = async (rawBody, signature) => {
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');

  if (expected !== signature) throw new AppError('Invalid webhook signature', 400);

  const event = JSON.parse(rawBody);
  if (event.event === 'payment.failed') {
    const orderId = event.payload.payment.entity.order_id;
    await Payment.findOneAndUpdate({ razorpayOrderId: orderId }, { status: 'FAILED' });
  }

  return { received: true };
};

const getPayment = async (bookingId, userId, role) => {
  const payment = await Payment.findOne({ bookingId }).populate('bookingId');
  if (!payment) throw new AppError('Payment not found', 404);
  if (role !== 'ADMIN' && payment.bookingId.userId.toString() !== userId) {
    throw new AppError('Forbidden', 403);
  }
  return payment;
};

const refundPayment = async (id) => {
  const payment = await Payment.findById(id);
  if (!payment) throw new AppError('Payment not found', 404);
  if (payment.status !== 'PAID') throw new AppError('Only PAID payments can be refunded', 400);

  await razorpay.payments.refund(payment.razorpayPaymentId, {
    amount: Math.round(payment.amount * 100),
  });

  payment.status = 'REFUNDED';
  return payment.save();
};

module.exports = { createOrder, verifyPayment, handleWebhook, getPayment, refundPayment };
