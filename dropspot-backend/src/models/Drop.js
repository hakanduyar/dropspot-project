const pool = require('../config/database');

class Drop {
  static async create(dropData) {
    const { title, description, image_url, total_stock, claim_window_start, claim_window_end } = dropData;
    
    const result = await pool.query(
      `INSERT INTO drops (title, description, image_url, total_stock, available_stock, claim_window_start, claim_window_end, status) 
       VALUES ($1, $2, $3, $4, $4, $5, $6, 'upcoming') 
       RETURNING *`,
      [title, description, image_url, total_stock, claim_window_start, claim_window_end]
    );
    
    return result.rows[0];
  }

  static async findAll() {
    const result = await pool.query(
      'SELECT * FROM drops ORDER BY claim_window_start ASC'
    );
    
    return result.rows;
  }

  static async findById(id) {
    const result = await pool.query(
      'SELECT * FROM drops WHERE id = $1',
      [id]
    );
    
    return result.rows[0];
  }

  static async update(id, dropData) {
    const { title, description, image_url, total_stock, claim_window_start, claim_window_end, status } = dropData;
    
    const result = await pool.query(
      `UPDATE drops 
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           image_url = COALESCE($3, image_url),
           total_stock = COALESCE($4, total_stock),
           claim_window_start = COALESCE($5, claim_window_start),
           claim_window_end = COALESCE($6, claim_window_end),
           status = COALESCE($7, status),
           updated_at = NOW()
       WHERE id = $8
       RETURNING *`,
      [title, description, image_url, total_stock, claim_window_start, claim_window_end, status, id]
    );
    
    return result.rows[0];
  }

  static async delete(id) {
    const result = await pool.query(
      'DELETE FROM drops WHERE id = $1 RETURNING *',
      [id]
    );
    
    return result.rows[0];
  }

  static async decrementStock(id) {
    const result = await pool.query(
      `UPDATE drops 
       SET available_stock = available_stock - 1 
       WHERE id = $1 AND available_stock > 0
       RETURNING *`,
      [id]
    );
    
    return result.rows[0];
  }

  static async getWaitlistCount(dropId) {
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM waitlist WHERE drop_id = $1',
      [dropId]
    );
    
    return parseInt(result.rows[0].count);
  }

  static async getClaimedCount(dropId) {
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM claims WHERE drop_id = $1',
      [dropId]
    );
    
    return parseInt(result.rows[0].count);
  }
}

module.exports = Drop;