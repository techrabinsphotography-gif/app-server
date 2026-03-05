const svc = require('./payments.service');
const { sendSuccess } = require('../../utils/apiResponse');

const createOrder = async (req, res, next) => {
  try {
    const data = await svc.createOrder(req.body.bookingId, req.user.id);
    sendSuccess(res, data, 'Order created', 201);
  } catch (err) { next(err); }
};

const verifyPayment = async (req, res, next) => {
  try {
    const data = await svc.verifyPayment(req.body);
    sendSuccess(res, data, 'Payment verified');
  } catch (err) { next(err); }
};

const handleWebhook = async (req, res, next) => {
  try {
    const sig = req.headers['x-razorpay-signature'];
    const data = await svc.handleWebhook(req.rawBody, sig);
    sendSuccess(res, data, 'Webhook received');
  } catch (err) { next(err); }
};

const getPayment = async (req, res, next) => {
  try {
    const data = await svc.getPayment(req.params.bookingId, req.user.id, req.user.role);
    sendSuccess(res, data);
  } catch (err) { next(err); }
};

const refundPayment = async (req, res, next) => {
  try {
    const data = await svc.refundPayment(req.params.id);
    sendSuccess(res, data, 'Refund initiated');
  } catch (err) { next(err); }
};

module.exports = { createOrder, verifyPayment, handleWebhook, getPayment, refundPayment };
