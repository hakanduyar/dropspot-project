const express = require('express');
const router = express.Router();
const { 
  createDrop, 
  updateDrop, 
  deleteDrop, 
  getAdminDrops,
  dropValidation 
} = require('../controllers/adminController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// Apply auth and admin middleware to all routes
router.use(authMiddleware);
router.use(adminMiddleware);

/**
 * @route   GET /api/admin/drops
 * @desc    Get all drops (admin view)
 * @access  Private/Admin
 */
router.get('/drops', getAdminDrops);

/**
 * @route   POST /api/admin/drops
 * @desc    Create new drop
 * @access  Private/Admin
 */
router.post('/drops', dropValidation, createDrop);

/**
 * @route   PUT /api/admin/drops/:id
 * @desc    Update drop
 * @access  Private/Admin
 */
router.put('/drops/:id', updateDrop);

/**
 * @route   DELETE /api/admin/drops/:id
 * @desc    Delete drop
 * @access  Private/Admin
 */
router.delete('/drops/:id', deleteDrop);

module.exports = router;