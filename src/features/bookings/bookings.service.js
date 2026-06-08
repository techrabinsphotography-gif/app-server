const Booking = require('../../models/Booking');
const Package = require('../../models/Package');
const { AppError } = require('../../utils/apiResponse');

// ─── List user bookings ───────────────────────────────────────────────────────
const listUserBookings = async (userId, status) => {
  const filter = { userId };
  if (status) filter.status = status.toUpperCase();
  return Booking.find(filter)
    .populate('serviceId', 'title slug coverImage')
    .populate('packageId', 'name tier price')
    .sort({ createdAt: -1 });
};

// ─── Create booking ───────────────────────────────────────────────────────────
const createBooking = async (userId, body) => {
  const {
    serviceId,
    packageId,
    scheduledDate,
    scheduledTime = '',
    outTime = '',
    extraHours = 0,
    extraHourRate = 1000,
    additionalDates = [],
    venue = '',
    specialNotes = '',
    addons = [],   // [{ addonId, name, price }]
  } = body;

  // Validate package
  const pkg = await Package.findById(packageId);
  if (!pkg) throw new AppError('Package not found', 404);

  // Calculate pricing
  const numDays = 1 + (Array.isArray(additionalDates) ? additionalDates.length : 0);
  const baseAmount = pkg.price * numDays;
  const addonsAmount = Array.isArray(addons)
    ? addons.reduce((sum, a) => sum + (Number(a.price) || 0), 0)
    : 0;
  const hours = Math.max(0, Math.floor(Number(extraHours) || 0));
  const rate = Number(extraHourRate) || 1000;
  const extraAmount = hours * rate;
  const preTax = baseAmount + addonsAmount + extraAmount;
  const taxAmount = Math.round(preTax * 0.08 * 100) / 100;
  const totalAmount = Math.round((preTax + taxAmount) * 100) / 100;

  return Booking.create({
    userId,
    serviceId,
    packageId,
    scheduledDate,
    scheduledTime,
    outTime,
    extraHours: hours,
    extraHourRate: rate,
    additionalDates,
    venue,
    specialNotes,
    addons,
    baseAmount,
    addonsAmount,
    extraAmount,
    taxAmount,
    totalAmount,
  });
};

// ─── Get single booking ───────────────────────────────────────────────────────
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

// ─── Cancel booking ───────────────────────────────────────────────────────────
const cancelBooking = async (id, userId) => {
  const booking = await Booking.findOne({ _id: id, userId });
  if (!booking) throw new AppError('Booking not found', 404);
  if (booking.status !== 'PENDING') throw new AppError('Only PENDING bookings can be cancelled', 400);
  booking.status = 'CANCELLED';
  return booking.save();
};

// ─── Admin: list all ─────────────────────────────────────────────────────────
const listAllBookings = async ({ status, page = 1, limit = 20 }) => {
  const filter = {};
  if (status) filter.status = status.toUpperCase();
  const skip = (page - 1) * limit;
  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .populate('userId', 'name email')
      .populate('serviceId', 'title')
      .populate('packageId', 'name tier price')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Booking.countDocuments(filter),
  ]);
  return { bookings, total, page: Number(page), limit: Number(limit) };
};

// ─── Admin: update status ─────────────────────────────────────────────────────
const updateBookingStatus = async (id, status) => {
  const booking = await Booking.findByIdAndUpdate(
    id,
    { status },
    { new: true, runValidators: true }
  );
  if (!booking) throw new AppError('Booking not found', 404);
  return booking;
};

module.exports = {
  listUserBookings,
  createBooking,
  getBookingById,
  cancelBooking,
  listAllBookings,
  updateBookingStatus,
};
