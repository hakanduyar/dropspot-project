const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Claim {
  static async create(userId, dropId) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Check if already claimed (idempotent)
      const existingClaim = await client.query(
        'SELECT * FROM claims WHERE user_id = $1 AND drop_id = $2 FOR UPDATE',
        [userId, dropId]
      );

      if (existingClaim.rows.length > 0) {
        await client.query('COMMIT');
        return { 
          success: true, 
          alreadyClaimed: true, 
          claim: existingClaim.rows[0] 
        };
      }

      // Check if drop is in claim window
      const dropResult = await client.query(
        `SELECT * FROM drops 
         WHERE id = $1 
         AND NOW() >= claim_window_start 
         AND NOW() <= claim_window_end
         FOR UPDATE`,
        [dropId]
      );

      if (dropResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return { 
          success: false, 
          error: 'Claim window is not active' 
        };
      }

      const drop = dropResult.rows[0];

      // Check stock availability
      if (drop.available_stock <= 0) {
        await client.query('ROLLBACK');
        return { 
          success: false, 
          error: 'No stock available' 
        };
      }

      // Check if user is in waitlist
      const waitlistResult = await client.query(
        'SELECT * FROM waitlist WHERE user_id = $1 AND drop_id = $2',
        [userId, dropId]
      );

      if (waitlistResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return { 
          success: false, 
          error: 'User must be in waitlist to claim' 
        };
      }

      // Check user's position in waitlist
      const positionResult = await client.query(
        `SELECT COUNT(*) + 1 as position
         FROM waitlist
         WHERE drop_id = $1
         AND (priority_score > $2 OR (priority_score = $2 AND joined_at < $3))`,
        [dropId, waitlistResult.rows[0].priority_score, waitlistResult.rows[0].joined_at]
      );

      const position = parseInt(positionResult.rows[0].position);

      // Check if user's position is within available stock
      if (position > drop.available_stock) {
        await client.query('ROLLBACK');
        return { 
          success: false, 
          error: 'Your position in waitlist exceeds available stock',
          position: position,
          availableStock: drop.available_stock
        };
      }

      // Generate unique claim code
      const claimCode = `CLAIM-${uuidv4().toUpperCase().substring(0, 8)}`;

      // Create claim
      const claimResult = await client.query(
        `INSERT INTO claims (user_id, drop_id, claim_code)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [userId, dropId, claimCode]
      );

      // Decrement available stock
      await client.query(
        `UPDATE drops 
         SET available_stock = available_stock - 1 
         WHERE id = $1`,
        [dropId]
      );

      // Remove from waitlist
      await client.query(
        'DELETE FROM waitlist WHERE user_id = $1 AND drop_id = $2',
        [userId, dropId]
      );

      await client.query('COMMIT');
      
      return { 
        success: true, 
        claimed: true, 
        claim: claimResult.rows[0],
        position: position
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async getUserClaims(userId) {
    const result = await pool.query(
      `SELECT c.*, d.title, d.description, d.image_url
       FROM claims c
       JOIN drops d ON c.drop_id = d.id
       WHERE c.user_id = $1
       ORDER BY c.claimed_at DESC`,
      [userId]
    );
    
    return result.rows;
  }

  static async getClaimByCode(claimCode) {
    const result = await pool.query(
      `SELECT c.*, d.title, d.description, u.email
       FROM claims c
       JOIN drops d ON c.drop_id = d.id
       JOIN users u ON c.user_id = u.id
       WHERE c.claim_code = $1`,
      [claimCode]
    );
    
    return result.rows[0];
  }

  static async hasUserClaimed(userId, dropId) {
    const result = await pool.query(
      'SELECT * FROM claims WHERE user_id = $1 AND drop_id = $2',
      [userId, dropId]
    );
    
    return result.rows.length > 0;
  }
}

module.exports = Claim;