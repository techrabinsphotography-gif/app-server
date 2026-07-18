const Booking = require('../../models/Booking');
const Package = require('../../models/Package');
const { AppError } = require('../../utils/apiResponse');
const { sendMail } = require('../../utils/mailer');
const { bookingConfirmationEmail, bookingRejectedEmail } = require('../../utils/emailTemplates');

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
    addons = [],          // [{ addonId, name, price }]
    totalAmount: clientTotal, // sent from app as fallback for custom bookings
  } = body;

  // ── Try to load package for server-side pricing ──────────────────────────
  let pkg = null;
  const isValidObjectId = (id) => id && /^[a-f\d]{24}$/i.test(String(id));

  if (isValidObjectId(packageId)) {
    pkg = await Package.findById(packageId);
  }

  // ── Pricing ──────────────────────────────────────────────────────────────
  let baseAmount, addonsAmount, extraAmount, taxAmount, totalAmount;

  if (pkg) {
    // Standard booking — calculate from package
    const numDays = 1 + (Array.isArray(additionalDates) ? additionalDates.length : 0);
    const baseDays = pkg.baseDays || 1;
    const edRate = pkg.extraDayPrice || 0;
    const extraDays = Math.max(0, numDays - baseDays);
    baseAmount = pkg.price + (extraDays * edRate);
    addonsAmount = Array.isArray(addons)
      ? addons.reduce((sum, a) => sum + (Number(a.price) || 0), 0)
      : 0;
    const hours = Math.max(0, Math.floor(Number(extraHours) || 0));
    const rate = Number(extraHourRate) || 1000;
    extraAmount = hours * rate;
    const preTax = baseAmount + addonsAmount + extraAmount;
    taxAmount = Math.round(preTax * 0.08 * 100) / 100;
    totalAmount = Math.round((preTax + taxAmount) * 100) / 100;
  } else {
    // Custom booking — no package, use amount provided by client
    baseAmount = Number(clientTotal) || 0;
    addonsAmount = Array.isArray(addons)
      ? addons.reduce((sum, a) => sum + (Number(a.price) || 0), 0)
      : 0;
    extraAmount = 0;
    taxAmount = 0;
    totalAmount = Number(clientTotal) || baseAmount;
  }

  return Booking.create({
    userId,
    serviceId: isValidObjectId(serviceId) ? serviceId : undefined,
    packageId: pkg ? packageId : undefined,
    scheduledDate,
    scheduledTime,
    outTime,
    extraHours: pkg ? Math.max(0, Math.floor(Number(extraHours) || 0)) : 0,
    extraHourRate: Number(extraHourRate) || 1000,
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
const listAllBookings = async ({ status, adminStatus, page = 1, limit = 20 }) => {
  const filter = {};
  if (status) filter.status = status.toUpperCase();
  if (adminStatus) filter.adminStatus = adminStatus.toUpperCase();
  const skip = (page - 1) * limit;
  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .populate('userId', 'name email')
      .populate('serviceId', 'title coverImage')
      .populate('packageId', 'name tier price')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Booking.countDocuments(filter),
  ]);
  return { bookings, total, page: Number(page), limit: Number(limit) };
};

// ─── Admin: update booking status ────────────────────────────────────────────
const updateBookingStatus = async (id, status) => {
  const booking = await Booking.findByIdAndUpdate(
    id,
    { status },
    { new: true, runValidators: true }
  );
  if (!booking) throw new AppError('Booking not found', 404);
  return booking;
};

// ─── Admin: approve or reject a booking ──────────────────────────────────────
const updateAdminStatus = async (id, adminStatus, adminNote = '') => {
  const allowed = ['APPROVED', 'REJECTED'];
  if (!allowed.includes(adminStatus)) throw new AppError('adminStatus must be APPROVED or REJECTED', 400);

  const booking = await Booking.findByIdAndUpdate(
    id,
    {
      adminStatus,
      adminNote,
      // When admin approves, also mark payment status as CONFIRMED
      ...(adminStatus === 'APPROVED' && { status: 'CONFIRMED' }),
    },
    { new: true, runValidators: true }
  ).populate('userId', 'name email')
    .populate('serviceId', 'title coverImage')
    .populate('packageId', 'name tier price');

  if (!booking) throw new AppError('Booking not found', 404);

  // ── Auto-create delivery tracking record when approved ───────────────────
  if (adminStatus === 'APPROVED') {
    const DeliveryTracking = require('../../models/DeliveryTracking');
    const existing = await DeliveryTracking.findOne({ bookingId: id });
    if (!existing) {
      await DeliveryTracking.create({ bookingId: id });
    }
  }

  // ── Send email notification ──────────────────────────────────────────────
  const userEmail = booking.userId?.email;
  const customerName = booking.userId?.name || 'Valued Customer';
  const orderId = booking._id.toString().slice(-8).toUpperCase();

  if (userEmail) {
    try {
      if (adminStatus === 'APPROVED') {
        const html = bookingConfirmationEmail({
          customerName,
          orderId,
          packageName: booking.packageId?.name || 'Photography Package',
          serviceName: booking.serviceId?.title || '',
          scheduledDate: booking.scheduledDate,
          scheduledTime: booking.scheduledTime,
          venue: booking.venue,
          totalAmount: booking.totalAmount,
          addons: booking.addons || [],
        });
        await sendMail(userEmail, `✓ Booking Confirmed — #${orderId} | Rabin's Photography`, html);
      } else if (adminStatus === 'REJECTED') {
        const html = bookingRejectedEmail({
          customerName,
          orderId,
          packageName: booking.packageId?.name || 'Photography Package',
          adminNote,
        });
        await sendMail(userEmail, `Booking Update — #${orderId} | Rabin's Photography`, html);
      }
    } catch (mailErr) {
      // Don't block the status update if email fails
      console.error('[updateAdminStatus] Email send failed:', mailErr.message);
    }
  }

  return booking;
};

module.exports = {
  listUserBookings,
  createBooking,
  getBookingById,
  cancelBooking,
  listAllBookings,
  updateBookingStatus,
  updateAdminStatus,
};
