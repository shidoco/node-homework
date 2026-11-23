const express = require("express");
require("dotenv").config();
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const { xss } = require("express-xss-sanitizer");
const rateLimiter = require("express-rate-limit");
const prisma = require("./db/prisma");
const app = express();

app.set("trust proxy", 1);

global.users = [];
global.tasks = [];

const timeRouter = require("./routes/timeRoutes");
const userRouter = require("./routes/userRoutes");
const taskRouter = require("./routes/taskRoutes");
const analyticsRouter = require("./routes/analyticsRoutes");
const notFound = require("./middleware/not-found");
const errorHandler = require("./middleware/error-handler");
const jwtMiddleware = require("./middleware/jwtMiddleware");

app.use(
  rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  }),
);

app.use(helmet());
app.use(express.json());
app.use(cookieParser());
app.use((req, res, next) => {
  Object.defineProperty(req, "query", {
    value: req.query,
    writable: true,
    enumerable: true,
    configurable: true,
  });
  next();
});
app.use(xss());

app.use("/api", timeRouter);

app.use("/api/users", userRouter);

app.use("/api/tasks", jwtMiddleware, taskRouter);

app.use("/api/analytics", jwtMiddleware, analyticsRouter);

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', db: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'error', db: 'not connected', error: err.message });
  }
});

app.post("/testpost", (req, res) => {
  res.status(200).json({
    message: "POST route works",
  });
});

app.use(notFound);
app.use(errorHandler);

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  console.log(`Server is listening on port ${port}...`);
});

let isShuttingDown = false;

async function shutdown(code = 0) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log("Shutting down gracefully...");

  try {
    await new Promise((resolve, reject) => {
      server.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    console.log("HTTP server closed.");

    // Close all PostgreSQL connections after the HTTP server has stopped.
    await prisma.$disconnect();
    console.log("Prisma disconnected");
  } catch (err) {
    console.error("Error during shutdown:", err);
    code = 1;
  } finally {
    process.exit(code);
  }
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

module.exports = { app, server };