import { Server } from 'http';
import mongoose from 'mongoose';
import app from './app';
import config from './app/config/index';
import cron from 'node-cron';
import { CustomerServices } from './app/modules/customer/customer.service';

let server: Server | null = null;

// Database connection
async function connectToDatabase() {
  try {
    await mongoose.connect(config.db_url as string);
    console.log('🛢 Database connected successfully');
  } catch (err) {
    console.error('Failed to connect to database:', err);
    process.exit(1);
  }
}

// Graceful shutdown
function gracefulShutdown(signal: string) {
  console.log(`Received ${signal}. Closing server...`);
  if (server) {
    server.close(() => {
      console.log('Server closed gracefully');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
}

// Application bootstrap
async function bootstrap() {
  try {
    await connectToDatabase();
    //await seed();

    server = app.listen(config.port, () => {
      console.log(`🚀 Application is running on port ${config.port}`);
    });

// Run every 2 days at 8:00 AM US Eastern Time
cron.schedule('0 8 */2 * *', () => {
  console.log(`[CRON STARTED] Payment due reminder job triggered at: ${new Date().toLocaleString("en-US", { timeZone: "America/New_York" })}`);
  
  CustomerServices.sendPaymentDueReminders().catch((error) =>
    console.error('Cron job failed:', error)
  );
}, {
  timezone: 'America/New_York' // US Eastern Time
});


    console.log('Payment due reminder scheduler started.');

    // Listen for termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Error handling
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      gracefulShutdown('uncaughtException');
    });

    process.on('unhandledRejection', (error) => {
      console.error('Unhandled Rejection:', error);
      gracefulShutdown('unhandledRejection');
    });
  } catch (error) {
    console.error('Error during bootstrap:', error);
    process.exit(1);
  }
}

// Start the application
bootstrap();