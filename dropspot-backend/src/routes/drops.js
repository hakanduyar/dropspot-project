const express = require('express');
const router = express.Router();
const { 
  getAllDrops, 
  getDrop, 
  joinWaitlist, 
  leaveWaitlist, 
  claimDrop,
  getUserWaitlist,
  getUserClaims
} = require('../controllers/dropController');
const { authMiddleware } = require('../middleware/auth');

/**
 * @route   GET /api/drops
 * @desc    Get all drops
 * @access  Public (with optional auth for user-specific data)
 */
router.get('/', (req, res, next) => {
  // Optional auth - if token exists, verify it, otherwise continue
  if (req.headers.authorization) {
    return authMiddleware(req, res, next);
  }
  next();
}, getAllDrops);

/**
 * @route   GET /api/drops/:id
 * @desc    Get single drop
 * @access  Public (with optional auth for user-specific data)
 */
router.get('/:id', (req, res, next) => {
  if (req.headers.authorization) {
    return authMiddleware(req, res, next);
  }
  next();
}, getDrop);

/**
 * @route   POST /api/drops/:id/join
 * @desc    Join drop waitlist
 * @access  Private
 */
router.post('/:id/join', authMiddleware, joinWaitlist);

/**
 * @route   POST /api/drops/:id/leave
 * @desc    Leave drop waitlist
 * @access  Private
 */
router.post('/:id/leave', authMiddleware, leaveWaitlist);

/**
 * @route   POST /api/drops/:id/claim
 * @desc    Claim drop
 * @access  Private
 */
router.post('/:id/claim', authMiddleware, claimDrop);

/**
 * @route   GET /api/drops/user/waitlist
 * @desc    Get user's waitlist
 * @access  Private
 */
router.get('/user/waitlist', authMiddleware, getUserWaitlist);

/**
 * @route   GET /api/drops/user/claims
 * @desc    Get user's claims
 * @access  Private
 */
router.get('/user/claims', authMiddleware, getUserClaims);

module.exports = router;