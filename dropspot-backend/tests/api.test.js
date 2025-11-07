const request = require('supertest');
const app = require('../src/index');
const pool = require('../src/config/database');
const { createTables, dropTables } = require('../src/utils/migrate');
const bcrypt = require('bcryptjs');

let authToken;
let adminToken;
let testUserId;
let testDropId;

beforeAll(async () => {
  // Setup test database
  await dropTables();
  await createTables();

  // Create test users
  const hashedPassword = await bcrypt.hash('testpass123', 10);
  
  const userResult = await pool.query(
    `INSERT INTO users (email, password, role, account_age_days) 
     VALUES ('test@example.com', $1, 'user', 30) 
     RETURNING id`,
    [hashedPassword]
  );
  testUserId = userResult.rows[0].id;

  await pool.query(
    `INSERT INTO users (email, password, role, account_age_days) 
     VALUES ('admin@example.com', $1, 'admin', 365)`,
    [hashedPassword]
  );

  // Create test drop
  const dropResult = await pool.query(
    `INSERT INTO drops (title, description, total_stock, available_stock, claim_window_start, claim_window_end, status)
     VALUES ('Test Drop', 'Test Description', 100, 100, NOW() + INTERVAL '1 hour', NOW() + INTERVAL '3 hours', 'upcoming')
     RETURNING id`
  );
  testDropId = dropResult.rows[0].id;
});

afterAll(async () => {
  await pool.end();
});

describe('Auth API Integration Tests', () => {
  describe('POST /api/auth/signup', () => {
    test('should create new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'newuser@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('newuser@example.com');
      expect(response.body.data.token).toBeDefined();
    });

    test('should reject duplicate email', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should validate email format', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'invalidemail',
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    test('should login successfully with correct credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'testpass123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      
      authToken = response.body.data.token;
    });

    test('should login admin successfully', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@example.com',
          password: 'testpass123'
        });

      expect(response.status).toBe(200);
      adminToken = response.body.data.token;
    });

    test('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});

describe('Drop API Integration Tests', () => {
  describe('GET /api/drops', () => {
    test('should get all drops without auth', async () => {
      const response = await request(app).get('/api/drops');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.drops)).toBe(true);
    });
  });

  describe('POST /api/drops/:id/join', () => {
    test('should join waitlist successfully', async () => {
      const response = await request(app)
        .post(`/api/drops/${testDropId}/join`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ signup_latency_ms: 150 });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.entry).toBeDefined();
    });

    test('should be idempotent - joining twice returns same result', async () => {
      const response = await request(app)
        .post(`/api/drops/${testDropId}/join`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ signup_latency_ms: 150 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('already');
    });

    test('should reject without auth token', async () => {
      const response = await request(app)
        .post(`/api/drops/${testDropId}/join`)
        .send({ signup_latency_ms: 150 });

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/drops/:id/leave', () => {
    test('should leave waitlist successfully', async () => {
      const response = await request(app)
        .post(`/api/drops/${testDropId}/leave`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should be idempotent - leaving twice is ok', async () => {
      const response = await request(app)
        .post(`/api/drops/${testDropId}/leave`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});

describe('Admin API Integration Tests', () => {
  describe('POST /api/admin/drops', () => {
    test('should create drop with admin token', async () => {
      const response = await request(app)
        .post('/api/admin/drops')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'New Admin Drop',
          description: 'Created by admin',
          total_stock: 50,
          claim_window_start: new Date(Date.now() + 3600000).toISOString(),
          claim_window_end: new Date(Date.now() + 7200000).toISOString()
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.drop.title).toBe('New Admin Drop');
    });

    test('should reject non-admin user', async () => {
      const response = await request(app)
        .post('/api/admin/drops')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Unauthorized Drop',
          total_stock: 50,
          claim_window_start: new Date(Date.now() + 3600000).toISOString(),
          claim_window_end: new Date(Date.now() + 7200000).toISOString()
        });

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /api/admin/drops/:id', () => {
    test('should delete drop with admin token', async () => {
      const response = await request(app)
        .delete(`/api/admin/drops/${testDropId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});