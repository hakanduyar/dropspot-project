const pool = require('../config/database');
const { calculatePriorityScore } = require('../utils/seedGenerator');

class Waitlist {
  static async join(userId, dropId, signupLatencyMs = 0) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Check if already in waitlist (idempotent)
      const existingEntry = await client.query(
        'SELECT * FROM waitlist WHERE user_id = $1 AND drop_id = $2 FOR UPDATE',
        [userId, dropId]
      );

      if (existingEntry.rows.length > 0) {
        await client.query('COMMIT');
        return { 
          success: true, 
          alreadyJoined: true, 
          entry: existingEntry.rows[0] 
        };
      }

      // Get user account age
      const userResult = await client.query(
        'SELECT account_age_days FROM users WHERE id = $1',
        [userId]
      );
      const accountAgeDays = userResult.rows[0]?.account_age_days || 0;

      // Count rapid actions (joins in last 10 minutes)
      const rapidActionsResult = await client.query(
        `SELECT COUNT(*) as count FROM waitlist 
         WHERE user_id = $1 AND joined_at > NOW() - INTERVAL '10 minutes'`,
        [userId]
      );
      const rapidActions = parseInt(rapidActionsResult.rows[0].count);

      // Calculate priority score using project seed
      const seed = process.env.PROJECT_SEED || 'defaultseed';
      const priorityScore = calculatePriorityScore(seed, signupLatencyMs, accountAgeDays, rapidActions);

      // Insert into waitlist
      const result = await client.query(
        `INSERT INTO waitlist (user_id, drop_id, priority_score, signup_latency_ms, rapid_actions)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [userId, dropId, priorityScore, signupLatencyMs, rapidActions]
      );

      await client.query('COMMIT');
      
      return { 
        success: true, 
        alreadyJoined: false, 
        entry: result.rows[0] 
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async leave(userId, dropId) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Delete from waitlist (idempotent)
      const result = await client.query(
        'DELETE FROM waitlist WHERE user_id = $1 AND drop_id = $2 RETURNING *',
        [userId, dropId]
      );

      await client.query('COMMIT');
      
      if (result.rows.length === 0) {
        return { success: true, notInWaitlist: true };
      }

      return { success: true, removed: true, entry: result.rows[0] };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async getByDropId(dropId) {
    const result = await pool.query(
      `SELECT w.*, u.email 
       FROM waitlist w
       JOIN users u ON w.user_id = u.id
       WHERE w.drop_id = $1
       ORDER BY w.priority_score DESC, w.joined_at ASC`,
      [dropId]
    );
    
    return result.rows;
  }

  static async getUserWaitlist(userId) {
    const result = await pool.query(
      `SELECT w.*, d.title, d.claim_window_start, d.claim_window_end, d.status
       FROM waitlist w
       JOIN drops d ON w.drop_id = d.id
       WHERE w.user_id = $1
       ORDER BY w.joined_at DESC`,
      [userId]
    );
    
    return result.rows;
  }

  static async isUserInWaitlist(userId, dropId) {
    const result = await pool.query(
      'SELECT * FROM waitlist WHERE user_id = $1 AND drop_id = $2',
      [userId, dropId]
    );
    
    return result.rows.length > 0;
  }
}

module.exports = Waitlist;