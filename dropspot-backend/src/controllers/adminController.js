const Drop = require('../models/Drop');
const { body, validationResult } = require('express-validator');

// Validation rules
const dropValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').optional().trim(),
  body('total_stock').isInt({ min: 1 }).withMessage('Total stock must be at least 1'),
  body('claim_window_start').isISO8601().withMessage('Valid claim window start date is required'),
  body('claim_window_end').isISO8601().withMessage('Valid claim window end date is required')
];

// Create drop
const createDrop = async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { title, description, image_url, total_stock, claim_window_start, claim_window_end } = req.body;

    // Validate date logic
    const startDate = new Date(claim_window_start);
    const endDate = new Date(claim_window_end);

    if (endDate <= startDate) {
      return res.status(400).json({ 
        success: false, 
        message: 'Claim window end must be after start' 
      });
    }

    // Create drop
    const drop = await Drop.create({
      title,
      description,
      image_url,
      total_stock,
      claim_window_start,
      claim_window_end
    });

    res.status(201).json({
      success: true,
      message: 'Drop created successfully',
      data: { drop }
    });
  } catch (error) {
    console.error('Create drop error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while creating drop' 
    });
  }
};

// Update drop
const updateDrop = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, image_url, total_stock, claim_window_start, claim_window_end, status } = req.body;

    // Check if drop exists
    const existingDrop = await Drop.findById(id);
    if (!existingDrop) {
      return res.status(404).json({ 
        success: false, 
        message: 'Drop not found' 
      });
    }

    // Validate date logic if both dates are provided
    if (claim_window_start && claim_window_end) {
      const startDate = new Date(claim_window_start);
      const endDate = new Date(claim_window_end);

      if (endDate <= startDate) {
        return res.status(400).json({ 
          success: false, 
          message: 'Claim window end must be after start' 
        });
      }
    }

    // Update drop
    const drop = await Drop.update(id, {
      title,
      description,
      image_url,
      total_stock,
      claim_window_start,
      claim_window_end,
      status
    });

    res.json({
      success: true,
      message: 'Drop updated successfully',
      data: { drop }
    });
  } catch (error) {
    console.error('Update drop error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while updating drop' 
    });
  }
};

// Delete drop
const deleteDrop = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if drop exists
    const existingDrop = await Drop.findById(id);
    if (!existingDrop) {
      return res.status(404).json({ 
        success: false, 
        message: 'Drop not found' 
      });
    }

    // Delete drop (cascade will handle waitlist and claims)
    await Drop.delete(id);

    res.json({
      success: true,
      message: 'Drop deleted successfully'
    });
  } catch (error) {
    console.error('Delete drop error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while deleting drop' 
    });
  }
};

// Get all drops (admin view with more details)
const getAdminDrops = async (req, res) => {
  try {
    const drops = await Drop.findAll();

    // Enrich with statistics
    const enrichedDrops = await Promise.all(
      drops.map(async (drop) => {
        const waitlistCount = await Drop.getWaitlistCount(drop.id);
        const claimedCount = await Drop.getClaimedCount(drop.id);
        
        return {
          ...drop,
          waitlist_count: waitlistCount,
          claimed_count: claimedCount
        };
      })
    );

    res.json({
      success: true,
      data: { drops: enrichedDrops }
    });
  } catch (error) {
    console.error('Get admin drops error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching drops' 
    });
  }
};

module.exports = {
  createDrop,
  updateDrop,
  deleteDrop,
  getAdminDrops,
  dropValidation
};