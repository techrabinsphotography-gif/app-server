const DeliveryTracking = require('../../models/DeliveryTracking');
const Booking = require('../../models/Booking');
const { AppError } = require('../../utils/apiResponse');
const notifSvc = require('../../utils/notificationService');

// ─── Helper: resolve booking owner userId from a bookingId ──────────────────
const _bookingOwnerId = async (bookingId) => {
  const b = await Booking.findById(bookingId, { userId: 1 }).lean();
  return b?.userId ? b.userId.toString() : null;
};

// ─── Helper: build a booking-action deep link ───────────────────────────────
const _trackingActionUrl = (bookingId) => `app://tracking/${bookingId}`;

// ─── Get or create tracking record for a booking ────────────────────────────
const getOrCreateTracking = async (bookingId) => {
  let tracking = await DeliveryTracking.findOne({ bookingId }).populate({
    path: 'bookingId',
    populate: [
      { path: 'userId', select: 'name email' },
      { path: 'serviceId', select: 'title coverImage' },
      { path: 'packageId', select: 'name tier price' },
    ],
  });

  if (!tracking) {
    // Verify the booking exists and is approved
    const booking = await Booking.findById(bookingId);
    if (!booking) throw new AppError('Booking not found', 404);
    tracking = await DeliveryTracking.create({ bookingId });
    tracking = await DeliveryTracking.findById(tracking._id).populate({
      path: 'bookingId',
      populate: [
        { path: 'userId', select: 'name email' },
        { path: 'serviceId', select: 'title coverImage' },
        { path: 'packageId', select: 'name tier price' },
      ],
    });
  }
  return tracking;
};

// ─── Admin: update current stage ────────────────────────────────────────────
const updateStage = async (bookingId, stage, note = '', userInputFields = []) => {
  const tracking = await getOrCreateTracking(bookingId);
  tracking.currentStage = stage;
  tracking.stages.push({ stage, note, completedAt: new Date(), userInputFields });
  await tracking.save();

  // ── Push per-user notification to the booking owner ────────────────────────
  try {
    const userId = await _bookingOwnerId(bookingId);
    if (userId) {
      await notifSvc.sendToUser(userId, {
        title: `Booking Update: ${stage}`,
        message: note
          ? `A new stage was added to your booking. ${note}`
          : `A new stage was added to your booking. Tap to view details.`,
        type: 'booking',
        actionUrl: _trackingActionUrl(bookingId),
      });
    }
  } catch (_) { /* never block the main flow on notif failure */ }

  return tracking;
};

// ─── Admin: update order items list ─────────────────────────────────────────
const updateOrderItems = async (bookingId, items) => {
  const tracking = await getOrCreateTracking(bookingId);
  tracking.orderItems = items;
  await tracking.save();
  return tracking;
};

// ─── Admin: add a media preview ─────────────────────────────────────────────
const addMediaPreview = async (bookingId, { url, type = 'IMAGE', caption = '', validFrom, validUntil }) => {
  const tracking = await getOrCreateTracking(bookingId);
  tracking.mediaPreviews.push({ url, type, caption, validFrom: validFrom || null, validUntil: validUntil || null });
  await tracking.save();

  // ── Push per-user notification to the booking owner ────────────────────────
  try {
    const userId = await _bookingOwnerId(bookingId);
    if (userId) {
      await notifSvc.sendToUser(userId, {
        title: `New ${type.toLowerCase()} preview ready`,
        message: caption
          ? `A new preview was shared: ${caption}`
          : `A new preview is ready for your booking. Tap to view.`,
        type: 'service',
        actionUrl: _trackingActionUrl(bookingId),
      });
    }
  } catch (_) { /* silent */ }

  return tracking;
};

// ─── Admin: remove a media preview ──────────────────────────────────────────
const removeMediaPreview = async (bookingId, previewId) => {
  const tracking = await DeliveryTracking.findOne({ bookingId });
  if (!tracking) throw new AppError('Tracking not found', 404);
  tracking.mediaPreviews = tracking.mediaPreviews.filter(m => m._id.toString() !== previewId);
  await tracking.save();
  return tracking;
};

// ─── Admin: mark as fully delivered ─────────────────────────────────────────
const markDelivered = async (bookingId) => {
  const tracking = await getOrCreateTracking(bookingId);
  tracking.isDelivered = true;
  tracking.deliveredAt = new Date();
  tracking.currentStage = 'Delivered';
  tracking.stages.push({ stage: 'Delivered', note: 'All deliverables handed over.', completedAt: new Date() });
  await tracking.save();

  // ── Push per-user notification to the booking owner ────────────────────────
  try {
    const userId = await _bookingOwnerId(bookingId);
    if (userId) {
      await notifSvc.sendToUser(userId, {
        title: '🎉 Your booking is fully delivered',
        message: 'All deliverables have been handed over. Thanks for choosing Robin Photo Studio!',
        type: 'booking',
        actionUrl: _trackingActionUrl(bookingId),
      });
    }
  } catch (_) { /* silent */ }

  return tracking;
};

// ─── User: get tracking (only valid/active media previews) ──────────────────
const getTrackingForUser = async (bookingId, userId, role) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new AppError('Booking not found', 404);
  if (role !== 'ADMIN' && booking.userId.toString() !== userId) {
    throw new AppError('Forbidden', 403);
  }

  const tracking = await DeliveryTracking.findOne({ bookingId }).populate({
    path: 'bookingId',
    select: 'serviceId packageId scheduledDate totalAmount adminStatus',
    populate: [
      { path: 'serviceId', select: 'title coverImage' },
      { path: 'packageId', select: 'name tier' },
    ],
  });

  if (!tracking) return null;

  // Filter media previews to only those within validity window (for non-admin)
  if (role !== 'ADMIN') {
    const now = new Date();
    const filteredPreviews = tracking.mediaPreviews.filter(m => {
      if (m.validUntil && new Date(m.validUntil) < now) return false; // expired
      if (m.validFrom && new Date(m.validFrom) > now) return false;   // not yet active
      return true;
    });
    // Return a plain object with filtered previews
    const obj = tracking.toObject();
    obj.mediaPreviews = filteredPreviews;
    return obj;
  }

  return tracking;
};

// ─── Admin: get all tracking records ────────────────────────────────────────
const listAllTracking = async ({ page = 1, limit = 20 }) => {
  const skip = (page - 1) * limit;
  const [records, total] = await Promise.all([
    DeliveryTracking.find()
      .populate({
        path: 'bookingId',
        populate: [
          { path: 'userId', select: 'name email' },
          { path: 'serviceId', select: 'title coverImage' },
          { path: 'packageId', select: 'name tier price' },
        ],
      })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    DeliveryTracking.countDocuments(),
  ]);
  return { records, total, page: Number(page), limit: Number(limit) };
};

// ─── User: submit response to a stage input field ───────────────────────────
const submitStageResponse = async (bookingId, userId, role, stageId, fieldId, response) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new AppError('Booking not found', 404);
  if (role !== 'ADMIN' && booking.userId.toString() !== userId) throw new AppError('Forbidden', 403);

  const tracking = await DeliveryTracking.findOne({ bookingId });
  if (!tracking) throw new AppError('Tracking not found', 404);

  const stage = tracking.stages.id(stageId);
  if (!stage) throw new AppError('Stage not found', 404);

  const field = stage.userInputFields.id(fieldId);
  if (!field) throw new AppError('Field not found', 404);

  field.userResponse = response || '';
  field.respondedAt = new Date();
  tracking.markModified('stages');
  await tracking.save();
  return tracking;
};
// ─── User: submit feedback ───────────────────────────────────────────────────
const submitFeedback = async (bookingId, userId, role, { rating, comment }) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new AppError('Booking not found', 404);
  if (role !== 'ADMIN' && booking.userId.toString() !== userId) {
    throw new AppError('Forbidden', 403);
  }

  const tracking = await DeliveryTracking.findOne({ bookingId });
  if (!tracking) throw new AppError('Tracking not found', 404);

  tracking.feedback = { rating: rating || null, comment: comment || '', submittedAt: new Date() };
  await tracking.save();
  return tracking;
};

module.exports = {
  getOrCreateTracking,
  updateStage,
  updateOrderItems,
  addMediaPreview,
  removeMediaPreview,
  markDelivered,
  getTrackingForUser,
  listAllTracking,
  submitStageResponse,
  submitFeedback,
};
