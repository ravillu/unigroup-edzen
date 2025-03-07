import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import * as schema from '@shared/schema';

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be set. Did you forget to provision a database?');
}

// Configure connection pool
const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 2000, // How long to wait for a connection
  maxUses: 7500, // Close and replace pooled connections after this many uses to prevent memory leaks
};

class DatabasePool {
  private static instance: Pool | null = null;
  private static retryCount = 0;
  private static maxRetries = 3;

  static async getInstance(): Promise<Pool> {
    if (!this.instance) {
      try {
        console.log('Creating new database pool...');
        this.instance = new Pool(poolConfig);

        // Test the connection
        const client = await this.instance.connect();
        await client.query('SELECT 1'); // Verify we can execute queries
        client.release();

        console.log('Database connection established successfully');

        // Add error handler for the pool
        this.instance.on('error', (err) => {
          console.error('Unexpected error on idle client', err);
          if (this.retryCount < this.maxRetries) {
            this.retryCount++;
            console.log(`Attempting to reconnect... (Attempt ${this.retryCount}/${this.maxRetries})`);
            this.instance = new Pool(poolConfig);
          }
        });

        // Add clean up on process termination
        process.on('SIGINT', () => this.cleanup());
        process.on('SIGTERM', () => this.cleanup());

      } catch (error) {
        console.error('Failed to create connection pool:', error);
        throw error;
      }
    }
    return this.instance;
  }

  static async cleanup(): Promise<void> {
    if (this.instance) {
      console.log('Closing database pool...');
      await this.instance.end();
      this.instance = null;
    }
  }
}

// Initialize pool and db
let pool: Pool;
let db: ReturnType<typeof drizzle>;

// Export asynchronous initialization function
export async function initializeDatabase() {
  try {
    console.log('Initializing database connection...');
    pool = await DatabasePool.getInstance();
    db = drizzle({ client: pool, schema });
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

// Handle uncaught promise rejections
process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
  DatabasePool.cleanup().catch(console.error);
});

// Export initialized instances
export { pool, db };