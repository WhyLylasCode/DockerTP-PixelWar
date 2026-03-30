const { createClient } = require("redis");
const config = require("./config");

const redis = createClient({
  url: config.redisUrl
});

redis.on("error", (err) => {
  console.error("Redis error:", err.message);
});

async function connectRedis() {
  if (!redis.isOpen) {
    await redis.connect();
  }
}

async function setPixelInCache(x, y, color) {
  const key = `grid:${x}:${y}`;
  await redis.set(key, color);
}

async function getGridFromCache(width, height) {
  const multi = redis.multi();

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      multi.get(`grid:${x}:${y}`);
    }
  }

  const values = await multi.exec();
  return values;
}

async function clearGridCache() {
  const keys = await redis.keys("grid:*");
  if (keys.length > 0) {
    await redis.del(keys);
  }
}

async function healthcheckRedis() {
  await redis.ping();
}

module.exports = {
  redis,
  connectRedis,
  setPixelInCache,
  getGridFromCache,
  clearGridCache,
  healthcheckRedis
};