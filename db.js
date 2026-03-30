const { Pool } = require("pg");
const config = require("./config");

const pool = new Pool({
  connectionString: config.databaseUrl
});

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS pixels (
      x INTEGER NOT NULL,
      y INTEGER NOT NULL,
      color VARCHAR(7) NOT NULL,
      updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
      PRIMARY KEY (x, y)
    );
  `);
}

async function getAllPixels() {
  const result = await pool.query(
    `SELECT x, y, color, updated_at FROM pixels ORDER BY y, x`
  );
  return result.rows;
}

async function upsertPixel(x, y, color) {
  const result = await pool.query(
    `
    INSERT INTO pixels (x, y, color, updated_at)
    VALUES ($1, $2, $3, NOW())
    ON CONFLICT (x, y)
    DO UPDATE SET color = EXCLUDED.color, updated_at = NOW()
    RETURNING x, y, color, updated_at;
    `,
    [x, y, color]
  );

  return result.rows[0];
}

async function healthcheckDb() {
  await pool.query("SELECT 1");
}

module.exports = {
  pool,
  initDb,
  getAllPixels,
  upsertPixel,
  healthcheckDb
};