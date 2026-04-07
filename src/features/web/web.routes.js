'use strict';
const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/authenticate');
const { authorize } = require('../../middleware/authorize');
const ctrl = require('./web.controller');

// ── PUBLIC ROUTES (no auth needed) ──────────────────────────────────────────
// Team
router.get('/team', ctrl.getTeam);

// Blog
router.get('/blog', ctrl.listBlogPosts);
router.get('/blog/:id', ctrl.getBlogPost);

// Careers
router.get('/careers', ctrl.listCareerPosts);
router.get('/careers/:id', ctrl.getCareerPost);

// Cookie Policy
router.get('/cookie-policy', ctrl.getCookiePolicy);

// ── ADMIN-ONLY ROUTES ────────────────────────────────────────────────────────
router.use(authenticate, authorize('ADMIN'));

// Team management
router.post('/team/member', ctrl.addTeamMember);
router.put('/team/member/:id', ctrl.updateTeamMember);
router.delete('/team/member/:id', ctrl.deleteTeamMember);

// Blog management
router.get('/blog-admin/all', ctrl.listAllBlogPosts);   // includes drafts
router.post('/blog', ctrl.createBlogPost);
router.put('/blog/:id', ctrl.updateBlogPost);
router.delete('/blog/:id', ctrl.deleteBlogPost);

// Career management
router.get('/careers-admin/all', ctrl.listAllCareerPosts);
router.post('/careers', ctrl.createCareerPost);
router.put('/careers/:id', ctrl.updateCareerPost);
router.delete('/careers/:id', ctrl.deleteCareerPost);

// Cookie Policy management
router.put('/cookie-policy', ctrl.updateCookiePolicy);

module.exports = router;
