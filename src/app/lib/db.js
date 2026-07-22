import mysql from 'mysql2/promise';

let pool;

export async function getDbConnection() {
  if (pool) return pool;

  const config = {
    host: (process.env.DB_HOST || 'localhost').trim(),
    user: (process.env.DB_USER || 'root').trim(),
    password: (process.env.DB_PASSWORD || '').trim(),
    database: (process.env.DB_DATABASE || 'bank_sampah').trim(),
    port: parseInt(process.env.DB_PORT || '3306', 10),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  };

  if (config.host !== 'localhost' && config.host !== '127.0.0.1') {
    config.ssl = { minVersion: 'TLSv1.2', rejectUnauthorized: true };
  }

  try {
    pool = mysql.createPool(config);
    // Test the pool connection to verify MySQL is running
    const connection = await pool.getConnection();
    connection.release();
    console.log('MySQL Database pool connected successfully.');
    return pool;
  } catch (error) {
    console.error('MySQL database connection failed:', error.message);
    pool = null;
    throw new Error(`DB Connection Error: ${error.message}`);
  }
}

export async function query(sql, params) {
  try {
    const db = await getDbConnection();
    const [results] = await db.execute(sql, params);
    return results;
  } catch (error) {
    console.error(`Database query error [${sql}]:`, error.message);
    throw error;
  }
}
