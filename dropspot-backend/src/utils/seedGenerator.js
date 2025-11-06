const crypto = require('crypto');
const { execSync } = require('child_process');

/**
 * Generate unique seed for the project
 * Based on: remote URL + first commit timestamp + start time
 */
function generateProjectSeed() {
  try {
    // Get git remote URL
    const remoteUrl = execSync('git config --get remote.origin.url', { encoding: 'utf-8' }).trim();
    
    // Get first commit timestamp
    const firstCommit = execSync('git log --reverse --format=%ct | head -n1', { encoding: 'utf-8' }).trim();
    
    // Get current timestamp as start time (YYYYMMDDHHmm)
    const startTime = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12);
    
    // Combine all data
    const rawData = `${remoteUrl}|${firstCommit}|${startTime}`;
    
    // Generate SHA256 hash
    const hash = crypto.createHash('sha256').update(rawData).digest('hex');
    
    // Take first 12 characters as seed
    const seed = hash.slice(0, 12);
    
    console.log('📊 Seed Generation Info:');
    console.log('Remote URL:', remoteUrl);
    console.log('First Commit:', firstCommit);
    console.log('Start Time:', startTime);
    console.log('Raw Data:', rawData);
    console.log('Full Hash:', hash);
    console.log('🔑 Project Seed:', seed);
    
    return seed;
  } catch (error) {
    console.warn('⚠️  Could not generate seed from git, using fallback');
    // Fallback seed if git is not initialized
    const fallbackData = `dropspot|${Date.now()}|${new Date().toISOString()}`;
    const hash = crypto.createHash('sha256').update(fallbackData).digest('hex');
    return hash.slice(0, 12);
  }
}

/**
 * Generate coefficients from seed
 * These will be used in priority score calculation
 */
function generateCoefficients(seed) {
  const A = 7 + (parseInt(seed.slice(0, 2), 16) % 5);
  const B = 13 + (parseInt(seed.slice(2, 4), 16) % 7);
  const C = 3 + (parseInt(seed.slice(4, 6), 16) % 3);
  
  return { A, B, C };
}

/**
 * Calculate priority score for waitlist ordering
 * Formula: base + (signup_latency_ms % A) + (account_age_days % B) - (rapid_actions % C)
 */
function calculatePriorityScore(seed, signupLatencyMs, accountAgeDays, rapidActions) {
  const { A, B, C } = generateCoefficients(seed);
  const base = 1000;
  
  const score = base + 
                (signupLatencyMs % A) + 
                (accountAgeDays % B) - 
                (rapidActions % C);
  
  return Math.max(0, score); // Ensure non-negative
}

if (require.main === module) {
  const seed = generateProjectSeed();
  const coefficients = generateCoefficients(seed);
  
  console.log('\n📐 Generated Coefficients:');
  console.log('A =', coefficients.A);
  console.log('B =', coefficients.B);
  console.log('C =', coefficients.C);
  
  console.log('\n📝 Example Priority Score Calculation:');
  const exampleScore = calculatePriorityScore(seed, 250, 30, 2);
  console.log('Priority Score:', exampleScore);
  
  console.log('\n💡 Add this to your .env file:');
  console.log(`PROJECT_SEED=${seed}`);
}

module.exports = {
  generateProjectSeed,
  generateCoefficients,
  calculatePriorityScore
};