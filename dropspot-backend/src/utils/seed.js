const pool = require('../config/database');
const bcrypt = require('bcryptjs');

const seedDatabase = async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Create admin user
    const hashedAdminPassword = await bcrypt.hash('admin123', 10);
    await client.query(`
      INSERT INTO users (email, password, role, account_age_days)
      VALUES ('admin@dropspot.com', $1, 'admin', 365)
      ON CONFLICT (email) DO NOTHING
    `, [hashedAdminPassword]);

    // Create regular users
    const hashedUserPassword = await bcrypt.hash('user123', 10);
    await client.query(`
      INSERT INTO users (email, password, role, account_age_days)
      VALUES 
        ('user1@example.com', $1, 'user', 30),
        ('user2@example.com', $1, 'user', 15),
        ('user3@example.com', $1, 'user', 60)
      ON CONFLICT (email) DO NOTHING
    `, [hashedUserPassword]);

    // Create sample drops
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const twoWeeks = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    await client.query(`
      INSERT INTO drops (title, description, image_url, total_stock, available_stock, claim_window_start, claim_window_end, status)
      VALUES 
        ('Limited Edition Sneakers', 'Ultra rare sneakers, only 50 pairs available. Premium quality with unique design.', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff', 50, 50, $1, $2, 'upcoming'),
        ('Exclusive Watch Collection', 'Luxury watches with limited production. Handcrafted with precision.', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30', 30, 30, $3, $4, 'upcoming'),
        ('Designer Backpack', 'Premium backpack with innovative features. Perfect for everyday use.', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62', 100, 100, $5, $6, 'upcoming')
    `, [
      tomorrow.toISOString(), 
      new Date(tomorrow.getTime() + 2 * 60 * 60 * 1000).toISOString(),
      nextWeek.toISOString(),
      new Date(nextWeek.getTime() + 3 * 60 * 60 * 1000).toISOString(),
      twoWeeks.toISOString(),
      new Date(twoWeeks.getTime() + 4 * 60 * 60 * 1000).toISOString()
    ]);

    await client.query('COMMIT');
    console.log('✅ Database seeded successfully');
    console.log('\n📧 Test Credentials:');
    console.log('Admin: admin@dropspot.com / admin123');
    console.log('User:  user1@example.com / user123');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    client.release();
  }
};

if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = seedDatabase;