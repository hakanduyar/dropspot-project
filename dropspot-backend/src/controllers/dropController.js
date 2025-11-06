const Drop = require('../models/Drop');
const Waitlist = require('../models/Waitlist');
const Claim = require('../models/Claim');
const { body, validationResult } = require('express-validator');

// Get all drops
const getAllDrops = async (req, res) => {
  try {
    const drops = await Drop.findAll();

    // Enrich drops with waitlist and claim counts
    const enrichedDrops = await Promise.all(
      drops.map(async (drop) => {
        const waitlistCount = await Drop.getWaitlistCount(drop.id);
        const claimedCount = await Drop.getClaimedCount(drop.id);
        
        // Check if user is in waitlist (if authenticated)
        let userInWaitlist = false;
        let userClaimed = false;
        
        if (req.user) {
          userInWaitlist = await Waitlist.isUserInWaitlist(req.user.id, drop.id);
          userClaimed = await Claim.hasUserClaimed(req.user.id, drop.id);
        }

        return {
          ...drop,
          waitlist_count: waitlistCount,
          claimed_count: claimedCount,
          user_in_waitlist: userInWaitlist,
          user_claimed: userClaimed
        };
      })
    );

    res.json({
      success: true,
      data: { drops: enrichedDrops }
    });
  } catch (error) {
    console.error('Get drops error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching drops' 
    });
  }
};

// Get single drop
const getDrop = async (req, res) => {
  try {
    const { id } = req.params;
    const drop = await Drop.findById(id);

    if (!drop) {
      return res.status(404).json({ 
        success: false, 
        message: 'Drop not found' 
      });
    }

    const waitlistCount = await Drop.getWaitlistCount(drop.id);
    const claimedCount = await Drop.getClaimedCount(drop.id);
    
    let userInWaitlist = false;
    let userClaimed = false;
    
    if (req.user) {
      userInWaitlist = await Waitlist.isUserInWaitlist(req.user.id, drop.id);
      userClaimed = await Claim.hasUserClaimed(req.user.id, drop.id);
    }

    res.json({
      success: true,
      data: {
        drop: {
          ...drop,
          waitlist_count: waitlistCount,
          claimed_count: claimedCount,
          user_in_waitlist: userInWaitlist,
          user_claimed: userClaimed
        }
      }
    });
  } catch (error) {
    console.error('Get drop error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching drop' 
    });
  }
};

// Join waitlist
const joinWaitlist = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const signupLatencyMs = req.body.signup_latency_ms || 0;

    // Check if drop exists
    const drop = await Drop.findById(id);
    if (!drop) {
      return res.status(404).json({ 
        success: false, 
        message: 'Drop not found' 
      });
    }

    // Check if user already claimed
    const hasClaimed = await Claim.hasUserClaimed(userId, id);
    if (hasClaimed) {
      return res.status(400).json({ 
        success: false, 
        message: 'You have already claimed this drop' 
      });
    }

    // Join waitlist (idempotent)
    const result = await Waitlist.join(userId, id, signupLatencyMs);

    if (result.alreadyJoined) {
      return res.json({
        success: true,
        message: 'You are already in the waitlist',
        data: { entry: result.entry }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Successfully joined waitlist',
      data: { entry: result.entry }
    });
  } catch (error) {
    console.error('Join waitlist error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while joining waitlist' 
    });
  }
};

// Leave waitlist
const leaveWaitlist = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Leave waitlist (idempotent)
    const result = await Waitlist.leave(userId, id);

    if (result.notInWaitlist) {
      return res.json({
        success: true,
        message: 'You are not in the waitlist'
      });
    }

    res.json({
      success: true,
      message: 'Successfully left waitlist'
    });
  } catch (error) {
    console.error('Leave waitlist error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while leaving waitlist' 
    });
  }
};

// Claim drop
const claimDrop = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Attempt to claim (idempotent)
    const result = await Claim.create(userId, id);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error,
        data: result
      });
    }

    if (result.alreadyClaimed) {
      return res.json({
        success: true,
        message: 'You have already claimed this drop',
        data: { claim: result.claim }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Successfully claimed drop',
      data: { 
        claim: result.claim,
        position: result.position
      }
    });
  } catch (error) {
    console.error('Claim drop error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while claiming drop' 
    });
  }
};

// Get user's waitlist
const getUserWaitlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const waitlist = await Waitlist.getUserWaitlist(userId);

    res.json({
      success: true,
      data: { waitlist }
    });
  } catch (error) {
    console.error('Get user waitlist error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching waitlist' 
    });
  }
};

// Get user's claims
const getUserClaims = async (req, res) => {
  try {
    const userId = req.user.id;
    const claims = await Claim.getUserClaims(userId);

    res.json({
      success: true,
      data: { claims }
    });
  } catch (error) {
    console.error('Get user claims error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching claims' 
    });
  }
};

module.exports = {
  getAllDrops,
  getDrop,
  joinWaitlist,
  leaveWaitlist,
  claimDrop,
  getUserWaitlist,
  getUserClaims
};