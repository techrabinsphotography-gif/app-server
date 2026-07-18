const DeliveryTracking = require('../../models/DeliveryTracking');
const Booking = require('../../models/Booking');
const { AppError } = require('../../utils/apiResponse');

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
