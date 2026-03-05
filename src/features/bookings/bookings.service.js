const Booking = require('../../models/Booking');
const Package = require('../../models/Package');
const { AppError } = require('../../utils/apiResponse');

const listUserBookings = async (userId, status) => {
  const filter = { userId };
  if (status) filter.status = status.toUpperCase();
  return Booking.find(filter)
    .populate('serviceId', 'title slug coverImage')
    .populate('packageId', 'name tier price')
    .sort({ createdAt: -1 });
};

const createBooking = async (userId, { serviceId, packageId, scheduledDate, venue, specialNotes }) => {
  const pkg = await Package.findById(packageId);
  if (!pkg) throw new AppError('Package not found', 404);

  return Booking.create({
    userId,
    serviceId,
    packageId,
    scheduledDate,
    venue,
    specialNotes,
    totalAmount: pkg.price,
  });
};

const getBookingById = async (id, userId, role) => {
  const booking = await Booking.findById(id)
    .populate('serviceId', 'title slug coverImage')
    .populate('packageId', 'name tier price features');
  if (!booking) throw new AppError('Booking not found', 404);
  if (role !== 'ADMIN' && booking.userId.toString() !== userId) {
    throw new AppError('Forbidden', 403);
  }
  return booking;
};

const cancelBooking = async (id, userId) => {
  const booking = await Booking.findOne({ _id: id, userId });
  if (!booking) throw new AppError('Booking not found', 404);
  if (booking.status !== 'PENDING') throw new AppError('Only PENDING bookings can be cancelled', 400);
  booking.status = 'CANCELLED';
  return booking.save();
};

const listAllBookings = async ({ status, page = 1, limit = 20 }) => {
  const filter = {};
  if (status) filter.status = status.toUpperCase();
  const skip = (page - 1) * limit;
  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .populate('userId', 'name email')
      .populate('serviceId', 'title')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Booking.countDocuments(filter),
  ]);
  return { bookings, total, page: Number(page), limit: Number(limit) };
};

const updateBookingStatus = async (id, status) => {
  const booking = await Booking.findByIdAndUpdate(id, { status }, { new: true, runValidators: true });
  if (!booking) throw new AppError('Booking not found', 404);
  return booking;
};

module.exports = { listUserBookings, createBooking, getBookingById, cancelBooking, listAllBookings, updateBookingStatus };
