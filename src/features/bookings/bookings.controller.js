const svc = require('./bookings.service');
const { sendSuccess } = require('../../utils/apiResponse');

const listUserBookings = async (req, res, next) => {
  try {
    const data = await svc.listUserBookings(req.user.id, req.query.status);
    sendSuccess(res, data);
  } catch (err) { next(err); }
};

const createBooking = async (req, res, next) => {
  try {
    const data = await svc.createBooking(req.user.id, req.body);
    sendSuccess(res, data, 'Booking created', 201);
  } catch (err) { next(err); }
};

const getBookingById = async (req, res, next) => {
  try {
    const data = await svc.getBookingById(req.params.id, req.user.id, req.user.role);
    sendSuccess(res, data);
  } catch (err) { next(err); }
};

const cancelBooking = async (req, res, next) => {
  try {
    const data = await svc.cancelBooking(req.params.id, req.user.id);
    sendSuccess(res, data, 'Booking cancelled');
  } catch (err) { next(err); }
};

const listAllBookings = async (req, res, next) => {
  try {
    const data = await svc.listAllBookings(req.query);
    sendSuccess(res, data);
  } catch (err) { next(err); }
};

const updateBookingStatus = async (req, res, next) => {
  try {
    const data = await svc.updateBookingStatus(req.params.id, req.body.status);
    sendSuccess(res, data, 'Booking status updated');
  } catch (err) { next(err); }
};

module.exports = { listUserBookings, createBooking, getBookingById, cancelBooking, listAllBookings, updateBookingStatus };
