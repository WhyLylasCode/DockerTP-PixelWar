require("dotenv").config();

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

module.exports = {
  port: parsePositiveInt(process.env.PORT, 3000),
  nodeEnv: process.env.NODE_ENV || "development",
  gridWidth: parsePositiveInt(process.env.GRID_WIDTH, 32),
  gridHeight: parsePositiveInt(process.env.GRID_HEIGHT, 32),
  defaultColor: process.env.DEFAULT_COLOR || "#FFFFFF",
  databaseUrl:
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgres@localhost:5432/pixelwar",
  redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
  corsOrigin: process.env.CORS_ORIGIN || "*"
};