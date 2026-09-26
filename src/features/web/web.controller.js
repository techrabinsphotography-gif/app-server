'use strict';
const TeamMember = require('../../models/TeamMember');
const BlogPost = require('../../models/BlogPost');
const CookiePolicy = require('../../models/CookiePolicy');
const CareerPost = require('../../models/CareerPost');
const NewsletterSubscriber = require('../../models/NewsletterSubscriber');
const PrivacyPolicy = require('../../models/PrivacyPolicy');
const TermsOfService = require('../../models/TermsOfService');
const HelpSupport = require('../../models/HelpSupport');
const { sendMail } = require('../../utils/mailer');

// ── Newsletter broadcast helper ───────────────────────────────────────────────
// Sends one beautiful email per subscriber. Fires & forgets — errors are logged
// but never bubble up to block the blog save response.
const sendNewsletterBroadcast = async (post) => {
  try {
    const subscribers = await NewsletterSubscriber.find().select('email').lean();
    if (!subscribers.length) return;

    const blogUrl = `${process.env.SITE_URL || 'https://www.rabinsphotography.com'}/blog/${post._id}`;
    const coverImg = post.coverImage
      ? `<img src="${post.coverImage}" alt="${post.title}" style="width:100%;max-height:300px;object-fit:cover;border-radius:12px 12px 0 0;" />`
      : '';

    const html = `
      <!DOCTYPE html><html><head><meta charset="UTF-8"/>
      <meta name="viewport" content="width=device-width,initial-scale=1"/>
      </head><body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
      <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.08);">
        ${coverImg}
        <div style="padding:32px;">
          <div style="display:inline-block;background:#ff4f5a;color:#fff;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;padding:4px 12px;border-radius:20px;margin-bottom:16px;">
            New Post · ${post.category || 'Photography'}
          </div>
          <h1 style="margin:0 0 16px;font-size:24px;font-weight:800;color:#111;line-height:1.3;">
            ${post.title}
          </h1>
          <p style="margin:0 0 24px;font-size:15px;color:#555;line-height:1.7;">
            ${post.excerpt}
          </p>
          <a href="${blogUrl}"
             style="display:inline-block;background:linear-gradient(135deg,#ff4f5a,#ff8c42);color:#fff;text-decoration:none;padding:14px 28px;border-radius:30px;font-size:15px;font-weight:700;">
            Read Full Article →
          </a>
          <hr style="border:none;border-top:1px solid #eee;margin:32px 0;" />
          <div style="display:flex;align-items:center;gap:12px;">
            <div>
              <p style="margin:0;font-size:14px;font-weight:700;color:#111;">${post.author || "Rabin Ghosh"}</p>
              <p style="margin:0;font-size:12px;color:#888;">Rabin's Photography · ${post.readTime || '5 min read'}</p>
            </div>
          </div>
        </div>
        <div style="background:#f9f9f9;padding:20px 32px;text-align:center;border-top:1px solid #eee;">
          <p style="margin:0;font-size:12px;color:#aaa;">
            You're receiving this because you subscribed to Rabin's Photography newsletter.<br/>
            <a href="${process.env.SITE_URL || 'https://www.rabinsphotography.com'}/blog" style="color:#ff4f5a;text-decoration:none;">Visit our blog</a>
          </p>
        </div>
      </div>
      </body></html>
    `;

    // Send to all subscribers — fire & forget each one
    const promises = subscribers.map(sub =>
      sendMail(sub.email, `📸 New Article: ${post.title}`, html).catch(err =>
        console.error(`[newsletter] Failed to send to ${sub.email}:`, err.message)
      )
    );
    await Promise.allSettled(promises);
    console.log(`[newsletter] Broadcast sent to ${subscribers.length} subscriber(s) for: "${post.title}"`);
  } catch (err) {
    console.error('[newsletter] Broadcast error:', err.message);
  }
};

// ════════════════════════════════════════════
//  TEAM
// ════════════════════════════════════════════

/**
 * PUBLIC: GET /api/v1/web/team
 * Returns team members grouped by tier → position for the website.
 */
exports.getTeam = async (req, res) => {
  // Prevent CDN/browser caching so deletes/edits reflect immediately
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.set('Pragma', 'no-cache');

  const members = await TeamMember.find().sort({ order: 1, name: 1 });

  // Fixed tier order: core → backbone → crew
  const TIER_ORDER = ['core', 'backbone', 'crew'];
  const result = { core: {}, backbone: {}, crew: {} };

  members.forEach(m => {
    const tier = m.tier.toLowerCase().trim();
    const pos = m.position.trim();
    // Only include known tiers
    if (!result[tier]) result[tier] = {};
    if (!result[tier][pos]) result[tier][pos] = [];
    result[tier][pos].push({
      _id: m._id,
      name: m.name,
      image: m.imageUrl,
      position: m.position,
      tier: m.tier,
      bio: m.bio || '',
    });
  });

  // Remove empty tiers from response
  TIER_ORDER.forEach(t => {
    if (Object.keys(result[t]).length === 0) delete result[t];
  });

  res.json({ success: true, data: result });
};

/**
 * ADMIN: POST /api/v1/web/team/member
 * Body: { tier, position, name, imageUrl, order? }
 */
exports.addTeamMember = async (req, res) => {
  const { tier, position, name, imageUrl, order, bio } = req.body;
  if (!tier || !position || !name || !imageUrl) {
    return res.status(400).json({ success: false, message: 'tier, position, name, and imageUrl are required' });
  }
  const member = await TeamMember.create({
    tier: tier.toUpperCase(),
    position,
    name,
    imageUrl,
    bio: bio || '',
    order: order || 0,
  });
  res.status(201).json({ success: true, data: member });
};

/**
 * ADMIN: PUT /api/v1/web/team/member/:id
 */
exports.updateTeamMember = async (req, res) => {
  const { tier, position, name, imageUrl, order, bio } = req.body;
  const update = {};
  if (tier) update.tier = tier.toUpperCase();
  if (position) update.position = position;
  if (name) update.name = name;
  if (imageUrl) update.imageUrl = imageUrl;
  if (bio !== undefined) update.bio = bio;
  if (order !== undefined) update.order = order;

  const member = await TeamMember.findByIdAndUpdate(req.params.id, update, { new: true });
  if (!member) return res.status(404).json({ success: false, message: 'Member not found' });
  res.json({ success: true, data: member });
};

/**
 * ADMIN: DELETE /api/v1/web/team/member/:id
 */
exports.deleteTeamMember = async (req, res) => {
  const member = await TeamMember.findByIdAndDelete(req.params.id);
  if (!member) return res.status(404).json({ success: false, message: 'Member not found' });
  res.json({ success: true, message: 'Member deleted' });
};


// ════════════════════════════════════════════
//  BLOG
// ════════════════════════════════════════════

/**
 * PUBLIC: GET /api/v1/web/blog
 * Returns only published posts, ordered newest first.
 */
exports.listBlogPosts = async (req, res) => {
  const posts = await BlogPost.find({ published: true })
    .select('-content')
    .sort('-createdAt');
  res.json({ success: true, data: posts });
};

/**
 * PUBLIC: GET /api/v1/web/blog/:id
 * Returns a single published blog post (by _id or slug).
 */
exports.getBlogPost = async (req, res) => {
  const { id } = req.params;
  let post = null;
  // Try by MongoDB id first, then by slug
  if (/^[a-f\d]{24}$/i.test(id)) {
    post = await BlogPost.findOne({ _id: id, published: true });
  }
  if (!post) {
    post = await BlogPost.findOne({ slug: id, published: true });
  }
  if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
  res.json({ success: true, data: post });
};

/**
 * ADMIN: GET /api/v1/web/blog-admin/all
 * Returns ALL posts including drafts.
 */
exports.listAllBlogPosts = async (req, res) => {
  const posts = await BlogPost.find().sort('-createdAt');
  res.json({ success: true, data: posts });
};

/**
 * ADMIN: POST /api/v1/web/blog
 */
exports.createBlogPost = async (req, res) => {
  const { title, excerpt, content, author, category, coverImage, readTime, published, featured } = req.body;
  if (!title || !excerpt || !content) {
    return res.status(400).json({ success: false, message: 'title, excerpt, and content are required' });
  }
  const post = await BlogPost.create({
    title, excerpt, content,
    author: author || 'Rabin Das',
    category: category || 'Other',
    coverImage: coverImage || '',
    readTime: readTime || '5 min read',
    published: !!published,
    featured: !!featured,
  });

  // Send newsletter broadcast if post is published immediately
  if (post.published) {
    sendNewsletterBroadcast(post); // fire & forget
  }

  res.status(201).json({ success: true, data: post });
};

/**
 * ADMIN: PUT /api/v1/web/blog/:id
 */
exports.updateBlogPost = async (req, res) => {
  // Fetch the old version to detect draft → published transition
  const oldPost = await BlogPost.findById(req.params.id);
  const post = await BlogPost.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

  // Send broadcast only when transitioning from draft → published (not on every edit)
  const wasUnpublished = oldPost && !oldPost.published;
  const isNowPublished = post.published;
  if (wasUnpublished && isNowPublished) {
    sendNewsletterBroadcast(post); // fire & forget
  }

  res.json({ success: true, data: post });
};

/**
 * ADMIN: DELETE /api/v1/web/blog/:id
 */
exports.deleteBlogPost = async (req, res) => {
  const post = await BlogPost.findByIdAndDelete(req.params.id);
  if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
  res.json({ success: true, message: 'Post deleted' });
};


// ════════════════════════════════════════════
//  CAREERS
// ════════════════════════════════════════════

/**
 * PUBLIC: GET /api/v1/web/careers
 */
exports.listCareerPosts = async (req, res) => {
  const posts = await CareerPost.find({ status: 'OPEN' }).sort('-createdAt');
  res.json({ success: true, data: posts });
};

/**
 * PUBLIC: GET /api/v1/web/careers/:id
 */
exports.getCareerPost = async (req, res) => {
  const post = await CareerPost.findById(req.params.id);
  if (!post) return res.status(404).json({ success: false, message: 'Career post not found' });
  res.json({ success: true, data: post });
};

/**
 * ADMIN: GET /api/v1/web/careers-admin/all
 */
exports.listAllCareerPosts = async (req, res) => {
  const posts = await CareerPost.find().sort('-createdAt');
  res.json({ success: true, data: posts });
};

/**
 * ADMIN: POST /api/v1/web/careers
 */
exports.createCareerPost = async (req, res) => {
  const { title, department, location, type, description, requirements, status } = req.body;
  if (!title || !department || !description) {
    return res.status(400).json({ success: false, message: 'title, department, and description are required' });
  }
  const post = await CareerPost.create({
    title, department, location, type, description, requirements, status
  });
  res.status(201).json({ success: true, data: post });
};

/**
 * ADMIN: PUT /api/v1/web/careers/:id
 */
exports.updateCareerPost = async (req, res) => {
  const post = await CareerPost.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!post) return res.status(404).json({ success: false, message: 'Career post not found' });
  res.json({ success: true, data: post });
};

/**
 * ADMIN: DELETE /api/v1/web/careers/:id
 */
exports.deleteCareerPost = async (req, res) => {
  const post = await CareerPost.findByIdAndDelete(req.params.id);
  if (!post) return res.status(404).json({ success: false, message: 'Career post not found' });
  res.json({ success: true, message: 'Career post deleted' });
};


// ════════════════════════════════════════════
//  COOKIE POLICY
// ════════════════════════════════════════════

/**
 * PUBLIC: GET /api/v1/web/cookie-policy
 */
exports.getCookiePolicy = async (req, res) => {
  let doc = await CookiePolicy.findOne();
  if (!doc) {
    // Seed with defaults
    doc = await CookiePolicy.create({
      sections: [
        {
          title: 'What Are Cookies?',
          content: 'Cookies are small text files that are stored on your device (computer or mobile device) when you visit certain websites. They are widely used to make websites work more efficiently and to provide information to the owners of the site.',
        },
        {
          title: 'How We Use Cookies',
          content: 'Rabin\'s Photography uses cookies for the following purposes:\n- Essential Cookies: Necessary for the website to function properly, such as secure login and session management.\n- Analytics Cookies: Help us understand how visitors interact with our website by collecting and reporting information anonymously.\n- Functionality Cookies: Allow the website to remember choices you make and provide enhanced features.\n- Advertising Cookies: Used to deliver advertisements more relevant to you and your interests.',
        },
        {
          title: 'Your Choices',
          content: 'You can choose to accept or decline cookies. Most web browsers automatically accept cookies, but you can usually modify your browser setting to decline cookies if you prefer. This may prevent you from taking full advantage of the website.',
        },
        {
          title: 'Contact Us',
          content: 'If you have any questions about our Cookie Policy, please contact us at: privacy@rabinsphotography.com',
        },
      ],
      lastUpdated: new Date(),
    });
  }
  res.json({ success: true, data: doc });
};

/**
 * ADMIN: PUT /api/v1/web/cookie-policy
 * Body: { sections: [{ title, content }], lastUpdated? }
 */
exports.updateCookiePolicy = async (req, res) => {
  const { sections } = req.body;
  if (!sections || !Array.isArray(sections)) {
    return res.status(400).json({ success: false, message: 'sections array is required' });
  }
  let doc = await CookiePolicy.findOne();
  if (!doc) {
    doc = new CookiePolicy({ sections, lastUpdated: new Date() });
  } else {
    doc.sections = sections;
    doc.lastUpdated = new Date();
  }
  await doc.save();
  res.json({ success: true, data: doc });
};


// ════════════════════════════════════════════
//  PRIVACY POLICY
// ════════════════════════════════════════════

const DEFAULT_PRIVACY_SECTIONS = [
  { title: '1. Introduction', content: "Rabin's Photography, a brand of Nozze Arte Pvt. Ltd. (CIN: U74999WB2020PTC236330), is committed to protecting your privacy. By accessing our website or booking our services, you agree to the terms of this Privacy Policy." },
  { title: '2. Information We Collect', content: "We may collect: Full Name, Email Address, Phone Number, Address, payment info via secure gateways, photos/videos captured during shoots, and technical usage data (IP, browser, device)." },
  { title: '3. How We Use Your Information', content: "We use your data to process bookings and payments, deliver services, communicate about your project, provide customer support, and improve our services." },
  { title: '4. Data Sharing & Disclosure', content: "We do not sell or rent your personal data. We may share with payment gateway providers, cloud storage platforms, and internal team members for project execution." },
  { title: '5. Data Storage & Retention', content: "Client data is stored securely on cloud systems. Raw data is stored for up to 90 days unless otherwise agreed. After the retention period, data may be permanently deleted without notice." },
  { title: '6. Contact Information', content: "Email: support@rabinsphotography.com | Phone/WhatsApp: Available during office hours | Office Hours: Monday to Saturday, 10 AM – 7 PM" },
];

/**
 * PUBLIC: GET /api/v1/web/privacy-policy
 */
exports.getPrivacyPolicy = async (req, res) => {
  let doc = await PrivacyPolicy.findOne();
  if (!doc) {
    doc = await PrivacyPolicy.create({ sections: DEFAULT_PRIVACY_SECTIONS });
  }
  res.json({ success: true, data: doc });
};

/**
 * ADMIN: PUT /api/v1/web/privacy-policy
 */
exports.updatePrivacyPolicy = async (req, res) => {
  const { sections, effectiveDate } = req.body;
  if (!sections || !Array.isArray(sections)) {
    return res.status(400).json({ success: false, message: 'sections array is required' });
  }
  let doc = await PrivacyPolicy.findOne();
  if (!doc) {
    doc = new PrivacyPolicy({ sections, effectiveDate, lastUpdated: new Date() });
  } else {
    doc.sections = sections;
    if (effectiveDate) doc.effectiveDate = effectiveDate;
    doc.lastUpdated = new Date();
  }
  await doc.save();
  res.json({ success: true, data: doc });
};


// ════════════════════════════════════════════
//  TERMS OF SERVICE
// ════════════════════════════════════════════

const DEFAULT_TERMS_SECTIONS = [
  { title: '1. Acceptance of Terms', content: "By accessing or using Rabin's Photography website and services, you agree to be legally bound by these Terms of Service." },
  { title: '2. Company Information', content: "Rabin's Photography is a brand of Nozze Arte Pvt. Ltd. CIN: U74999WB2020PTC236330. We provide professional photography and videography services across India." },
  { title: '3. Booking & Payment Policy', content: "Booking is confirmed only after 50% advance payment. Advance is non-refundable and non-transferable. Deliverables will be shared only after full payment clearance." },
  { title: '4. Cancellation & Rescheduling', content: "Same-day cancellation: 100% advance will be retained. Rescheduling is allowed only in exceptional cases with valid proof and management approval. Any date change may incur additional charges." },
  { title: '5. Deliverables & Timelines', content: "Raw Photos: 1–10 days after full payment. Edited Photos: 45–60 days after selection. Cinematic Video: 60–90 days after event. Album Design: 20–30 days after photo selection. Album Delivery: 10–15 days after final approval." },
  { title: '6. Intellectual Property Rights', content: "Rabin's Photography retains full copyright of all images and videos. Clients receive a license for personal use only. Commercial usage requires prior written permission." },
  { title: '7. Governing Law', content: "These Terms shall be governed by the laws of India. Any disputes will be subject to the jurisdiction of Kolkata, West Bengal." },
  { title: '8. Contact Information', content: "Email: support@rabinsphotography.com | Phone/WhatsApp: Available during office hours | Office Hours: Monday to Saturday, 10 AM – 7 PM" },
];

/**
 * PUBLIC: GET /api/v1/web/terms-of-service
 */
exports.getTermsOfService = async (req, res) => {
  let doc = await TermsOfService.findOne();
  if (!doc) {
    doc = await TermsOfService.create({ sections: DEFAULT_TERMS_SECTIONS });
  }
  res.json({ success: true, data: doc });
};

/**
 * ADMIN: PUT /api/v1/web/terms-of-service
 */
exports.updateTermsOfService = async (req, res) => {
  const { sections, effectiveDate } = req.body;
  if (!sections || !Array.isArray(sections)) {
    return res.status(400).json({ success: false, message: 'sections array is required' });
  }
  let doc = await TermsOfService.findOne();
  if (!doc) {
    doc = new TermsOfService({ sections, effectiveDate, lastUpdated: new Date() });
  } else {
    doc.sections = sections;
    if (effectiveDate) doc.effectiveDate = effectiveDate;
    doc.lastUpdated = new Date();
  }
  await doc.save();
  res.json({ success: true, data: doc });
};


// ════════════════════════════════════════════
//  HELP & SUPPORT (FAQ)
// ════════════════════════════════════════════

const DEFAULT_FAQS = [
  { question: 'How do I book a session?', answer: 'You can book a session by contacting us via WhatsApp or call, or by filling out the booking form on our website. Your booking will be confirmed only after paying the required advance.' },
  { question: 'What is the advance payment policy?', answer: 'A 50% advance payment is required to confirm your booking. This advance is non-refundable and non-transferable.' },
  { question: 'What is your cancellation or rescheduling policy?', answer: 'Same-day cancellations will result in full advance retention. Rescheduling is allowed only in exceptional cases with valid proof and management approval.' },
  { question: 'What services do you offer?', answer: 'We offer wedding and pre-wedding photography, cinematic films, engagement, haldi and reception coverage, fashion and portfolio shoots, and corporate event coverage.' },
  { question: 'When will I receive my photos and videos?', answer: 'Raw photos: 1–10 days after full payment. Edited photos: 45–60 days after selection. Cinematic videos: 60–90 days. Album design: 20–30 days. Album delivery: 10–15 days after approval.' },
  { question: 'How many revisions are included?', answer: 'We offer 2 revisions for albums and 1 revision for videos. Additional revisions will be chargeable.' },
  { question: 'How long do you store our data?', answer: 'Raw data is stored for 30 days only. After delivery, clients are responsible for maintaining their own backup.' },
  { question: 'How can I contact support?', answer: 'Email: support@rabinsphotography.com | WhatsApp during working hours | Office Hours: Monday to Saturday, 10 AM – 7 PM.' },
];

/**
 * PUBLIC: GET /api/v1/web/help-support
 */
exports.getHelpSupport = async (req, res) => {
  let doc = await HelpSupport.findOne();
  if (!doc) {
    doc = await HelpSupport.create({ faqs: DEFAULT_FAQS });
  }
  res.json({ success: true, data: doc });
};

/**
 * ADMIN: PUT /api/v1/web/help-support
 */
exports.updateHelpSupport = async (req, res) => {
  const { faqs } = req.body;
  if (!faqs || !Array.isArray(faqs)) {
    return res.status(400).json({ success: false, message: 'faqs array is required' });
  }
  let doc = await HelpSupport.findOne();
  if (!doc) {
    doc = new HelpSupport({ faqs, lastUpdated: new Date() });
  } else {
    doc.faqs = faqs;
    doc.lastUpdated = new Date();
  }
  await doc.save();
  res.json({ success: true, data: doc });
};
