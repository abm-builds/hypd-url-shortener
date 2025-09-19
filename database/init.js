const fs = require('fs');
const path = require('path');
const pool = require('../config/database');

/**
 * Initialize database with schema
 */
async function initializeDatabase() {
  try {
    console.log('Initializing database...');
    
    // Read schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute schema
    await pool.query(schema);
    
    console.log('Database initialized successfully!');
    
    // Test connection
    const result = await pool.query('SELECT NOW()');
    console.log('Database connection test:', result.rows[0].now);
    
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

/**
 * Close database connection
 */
async function closeDatabase() {
  try {
    await pool.end();
    console.log('Database connection closed.');
  } catch (error) {
    console.error('Error closing database:', error);
  }
}

module.exports = {
  initializeDatabase,
  closeDatabase
};
