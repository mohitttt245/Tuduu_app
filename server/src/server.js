import 'dotenv/config';
import app from './app.js';
import { connectDatabase } from './config/db.js';
import { startReminderService } from './services/reminderService.js';

const port = Number(process.env.PORT || 5000);

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error('JWT_SECRET must be configured with at least 32 characters');
  process.exit(1);
}

try {
  await connectDatabase();
  startReminderService();
  app.listen(port, () => console.log(`Tuduu API listening on port ${port}`));
} catch (error) {
  console.error(`Unable to start API (${error.name || 'Error'}). Check the database connection and server settings.`);
  process.exit(1);
}
