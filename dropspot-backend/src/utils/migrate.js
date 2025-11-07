const pool = require('../config/database');

const createTables = async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        account_age_days INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Drops table
    await client.query(`
      CREATE TABLE IF NOT EXISTS drops (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        image_url VARCHAR(500),
        total_stock INTEGER NOT NULL,
        available_stock INTEGER NOT NULL,
        claim_window_start TIMESTAMP NOT NULL,
        claim_window_end TIMESTAMP NOT NULL,
        status VARCHAR(50) DEFAULT 'upcoming',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT available_stock_check CHECK (available_stock >= 0),
        CONSTRAINT available_stock_total CHECK (available_stock <= total_stock)
      )
    `);

    // Waitlist table
    await client.query(`
      CREATE TABLE IF NOT EXISTS waitlist (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        drop_id INTEGER NOT NULL REFERENCES drops(id) ON DELETE CASCADE,
        priority_score INTEGER DEFAULT 0,
        signup_latency_ms INTEGER DEFAULT 0,
        rapid_actions INTEGER DEFAULT 0,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, drop_id)
      )
    `);

    // Claims table
    await client.query(`
      CREATE TABLE IF NOT EXISTS claims (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        drop_id INTEGER NOT NULL REFERENCES drops(id) ON DELETE CASCADE,
        claim_code VARCHAR(255) UNIQUE NOT NULL,
        claimed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, drop_id)
      )
    `);

    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_waitlist_drop_id ON waitlist(drop_id);
      CREATE INDEX IF NOT EXISTS idx_waitlist_user_id ON waitlist(user_id);
      CREATE INDEX IF NOT EXISTS idx_waitlist_priority ON waitlist(drop_id, priority_score DESC);
      CREATE INDEX IF NOT EXISTS idx_claims_user_id ON claims(user_id);
      CREATE INDEX IF NOT EXISTS idx_claims_drop_id ON claims(drop_id);
      CREATE INDEX IF NOT EXISTS idx_drops_status ON drops(status);
    `);

    await client.query('COMMIT');
    console.log('✅ Database tables created successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error creating tables:', error);
    throw error;
  } finally {
    client.release();
  }
};

const dropTables = async () => {
  const client = await pool.connect();
  
  try {
    await client.query(`
      DROP TABLE IF EXISTS claims CASCADE;
      DROP TABLE IF EXISTS waitlist CASCADE;
      DROP TABLE IF EXISTS drops CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);
    console.log('✅ Database tables dropped successfully');
  } catch (error) {
    console.error('❌ Error dropping tables:', error);
    throw error;
  } finally {
    client.release();
  }
};

const runMigration = async () => {
  try {
    console.log('🔄 Running database migration...');
    await dropTables();
    await createTables();
    console.log('✅ Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  runMigration();
}

module.exports = { createTables, dropTables };