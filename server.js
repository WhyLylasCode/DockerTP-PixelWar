const http = require("http");
const express = require("express");
const cors = require("cors");
const { Server } = require("socket.io");

const config = require("./config");
const { initDb, getAllPixels, upsertPixel, healthcheckDb } = require("./db");
const {
  connectRedis,
  setPixelInCache,
  getGridFromCache,
  clearGridCache,
  healthcheckRedis
} = require("./redis");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: config.corsOrigin,
    methods: ["GET", "POST"]
  }
});

app.use(
  cors({
    origin: config.corsOrigin
  })
);
app.use(express.json());

function isValidHexColor(color) {
  return /^#[0-9A-Fa-f]{6}$/.test(color);
}

function isValidCoordinate(value, max) {
  return Number.isInteger(value) && value >= 0 && value < max;
}

function buildEmptyGrid() {
  return Array.from({ length: config.gridHeight }, () =>
    Array.from({ length: config.gridWidth }, () => config.defaultColor)
  );
}

async function rebuildCacheFromDb() {
  await clearGridCache();
  const pixels = await getAllPixels();

  for (const pixel of pixels) {
    await setPixelInCache(pixel.x, pixel.y, pixel.color);
  }
}

async function getGridState() {
  const rawValues = await getGridFromCache(config.gridWidth, config.gridHeight);
  const grid = buildEmptyGrid();

  let index = 0;
  for (let y = 0; y < config.gridHeight; y += 1) {
    for (let x = 0; x < config.gridWidth; x += 1) {
      const value = rawValues[index];
      if (typeof value === "string" && value.length > 0) {
        grid[y][x] = value;
      }
      index += 1;
    }
  }

  return {
    width: config.gridWidth,
    height: config.gridHeight,
    defaultColor: config.defaultColor,
    pixels: grid
  };
}

app.get("/health/live", async (_req, res) => {
  res.status(200).json({
    status: "alive"
  });
});

app.get("/health/ready", async (_req, res) => {
  try {
    await healthcheckDb();
    await healthcheckRedis();

    res.status(200).json({
      status: "ready"
    });
  } catch (error) {
    res.status(503).json({
      status: "not_ready",
      error: error.message
    });
  }
});

app.get("/grid", async (_req, res) => {
  try {
    const grid = await getGridState();
    res.status(200).json(grid);
  } catch (error) {
    console.error("GET /grid error:", error);
    res.status(500).json({
      error: "Unable to load grid"
    });
  }
});

app.post("/pixel", async (req, res) => {
  try {
    const { x, y, color } = req.body;

    if (!isValidCoordinate(x, config.gridWidth)) {
      return res.status(400).json({
        error: `Invalid x. Expected integer between 0 and ${config.gridWidth - 1}`
      });
    }

    if (!isValidCoordinate(y, config.gridHeight)) {
      return res.status(400).json({
        error: `Invalid y. Expected integer between 0 and ${config.gridHeight - 1}`
      });
    }

    if (!isValidHexColor(color)) {
      return res.status(400).json({
        error: "Invalid color. Expected HEX format like #FF00AA"
      });
    }

    const savedPixel = await upsertPixel(x, y, color);
    await setPixelInCache(x, y, color);

    const payload = {
      x: savedPixel.x,
      y: savedPixel.y,
      color: savedPixel.color,
      updatedAt: savedPixel.updated_at
    };

    io.emit("pixel_update", payload);

    return res.status(200).json({
      message: "Pixel updated",
      pixel: payload
    });
  } catch (error) {
    console.error("POST /pixel error:", error);
    return res.status(500).json({
      error: "Unable to update pixel"
    });
  }
});

io.on("connection", async (socket) => {
  console.log(`Client connected: ${socket.id}`);

  try {
    const grid = await getGridState();
    socket.emit("grid_init", grid);
  } catch (error) {
    console.error("Socket init error:", error);
  }

  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

async function start() {
  try {
    await initDb();
    await connectRedis();
    await rebuildCacheFromDb();

    server.listen(config.port, () => {
      console.log(`Backend listening on port ${config.port}`);
      console.log(
        `Grid size: ${config.gridWidth}x${config.gridHeight}, default color ${config.defaultColor}`
      );
    });
  } catch (error) {
    console.error("Startup error:", error);
    process.exit(1);
  }
}

async function shutdown(signal) {
  console.log(`${signal} received, shutting down...`);
  try {
    server.close(() => {
      console.log("HTTP server closed");
    });
    process.exit(0);
  } catch (error) {
    console.error("Shutdown error:", error);
    process.exit(1);
  }
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

start();