const pool = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static async create(email, password, role = 'user') {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await pool.query(
      `INSERT INTO users (email, password, role, account_age_days) 
       VALUES ($1, $2, $3, 0) 
       RETURNING id, email, role, account_age_days, created_at`,
      [email, hashedPassword, role]
    );
    
    return result.rows[0];
  }

  static async findByEmail(email) {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    
    return result.rows[0];
  }

  static async findById(id) {
    const result = await pool.query(
      'SELECT id, email, role, account_age_days, created_at FROM users WHERE id = $1',
      [id]
    );
    
    return result.rows[0];
  }

  static async comparePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  static async updateAccountAge(userId) {
    const result = await pool.query(
      `UPDATE users 
       SET account_age_days = EXTRACT(DAY FROM (NOW() - created_at))::INTEGER
       WHERE id = $1
       RETURNING account_age_days`,
      [userId]
    );
    
    return result.rows[0];
  }
}

module.exports = User;