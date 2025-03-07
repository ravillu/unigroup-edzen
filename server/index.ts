import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initializeDatabase } from "./db";
import { createServer } from "http";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }
      log(logLine);
    }
  });

  next();
});

async function startServer(port: number): Promise<void> {
  try {
    // Initialize database first
    log("Initializing database connection...");
    await initializeDatabase();
    log("Database connection established successfully");

    const server = await registerRoutes(app);

    // Error handling middleware
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      console.error('Server error:', err);
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
    });

    // Setup vite or serve static files
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // Start server with promise wrapper
    await new Promise<void>((resolve, reject) => {
      server.listen({ port, host: "0.0.0.0" }, () => {
        log(`Server started successfully on port ${port}`);
        resolve();
      });

      server.on('error', (error: NodeJS.ErrnoException) => {
        if (error.code === 'EADDRINUSE') {
          reject(new Error(`Port ${port} is already in use`));
        } else {
          reject(error);
        }
      });
    });

  } catch (error) {
    throw error;
  }
}

// Try to start server with fallback ports
(async () => {
  const ports = [5000, 3000, 8000];
  let started = false;

  for (const port of ports) {
    try {
      await startServer(port);
      started = true;
      break;
    } catch (error) {
      if (error instanceof Error && error.message.includes('already in use')) {
        log(`Port ${port} is in use, trying next port...`);
        continue;
      }
      console.error("Failed to start server:", error);
      process.exit(1);
    }
  }

  if (!started) {
    console.error("Could not find available port in range:", ports);
    process.exit(1);
  }
})();