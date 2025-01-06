import cron from 'node-cron';
import { fetchAndStoreServices } from "../controllers/serviceController.js"
 // Import your function to fetch and store services

// Schedule the job to run every day at midnight (12:00 AM)
cron.schedule('0 0 * * *', async () => {
  console.log('Running scheduled task: fetchAndStoreServices at 12:00 AM');
  await fetchAndStoreServices(); // Call your function to update services
});
