/**
 * Cloud Function to auto-delete voice messages after 7 days
 * Deploy with: firebase deploy --only functions:deleteExpiredVoiceMessages
 * 
 * Option 1: Schedule this function to run daily
 * Option 2: Add TTL field to Firestore documents and use Firestore TTL policy
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const storage = admin.storage();
const db = admin.database();

// Configuration
const VOICE_MSG_RETENTION_DAYS = 7;
const VOICE_MSG_RETENTION_MS = VOICE_MSG_RETENTION_DAYS * 24 * 60 * 60 * 1000;

/**
 * Scheduled function - runs daily at 2 AM UTC
 * Deletes voice message files and references older than 7 days
 */
exports.deleteExpiredVoiceMessages = functions
  .region('asia-southeast1')
  .pubsub.schedule('0 2 * * *') // Daily at 2 AM UTC
  .timeZone('UTC')
  .onRun(async (context) => {
    try {
      const bucket = storage.bucket();
      const prefix = 'voiceMsgs/';
      const cutoffTime = Date.now() - VOICE_MSG_RETENTION_MS;

      console.log(`Deleting voice messages older than ${VOICE_MSG_RETENTION_DAYS} days`);
      console.log(`Cutoff time: ${new Date(cutoffTime)}`);

      // List all voice message files
      const [files] = await bucket.getFiles({ prefix });

      let deletedCount = 0;
      const deletePromises = [];

      for (const file of files) {
        // Extract timestamp from filename format: voiceMsgs/roomCode/timestamp.webm
        const parts = file.name.split('/');
        if (parts.length !== 3) continue;

        const timestamp = parseInt(parts[2], 10);
        if (isNaN(timestamp)) continue;

        if (timestamp < cutoffTime) {
          console.log(`Deleting expired file: ${file.name}`);
          deletePromises.push(
            file.delete()
              .then(() => {
                deletedCount++;
                // Delete the message from database too
                const roomCode = parts[1];
                // Note: If you're storing message metadata in Firestore, delete that too
              })
              .catch(err => console.error(`Failed to delete ${file.name}:`, err))
          );
        }
      }

      await Promise.all(deletePromises);
      console.log(`Successfully deleted ${deletedCount} expired voice message files`);

      return { success: true, deletedCount };
    } catch (error) {
      console.error('Error in deleteExpiredVoiceMessages:', error);
      throw error;
    }
  });

/**
 * Alternative: HTTP trigger for manual cleanup
 * Call with: curl -X POST https://YOUR_REGION-YOUR_PROJECT.cloudfunctions.net/cleanupExpiredVoiceMessages
 */
exports.cleanupExpiredVoiceMessagesHttp = functions
  .region('asia-southeast1')
  .https.onCall(async (data, context) => {
    // Verify auth
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    try {
      const bucket = storage.bucket();
      const prefix = 'voiceMsgs/';
      const daysOld = data.daysOld || 7;
      const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);

      const [files] = await bucket.getFiles({ prefix });
      let deletedCount = 0;

      for (const file of files) {
        const parts = file.name.split('/');
        if (parts.length !== 3) continue;

        const timestamp = parseInt(parts[2], 10);
        if (!isNaN(timestamp) && timestamp < cutoffTime) {
          await file.delete();
          deletedCount++;
        }
      }

      return {
        success: true,
        message: `Deleted ${deletedCount} voice messages older than ${daysOld} days`,
        deletedCount,
      };
    } catch (error) {
      console.error('Error in cleanup:', error);
      throw new functions.https.HttpsError('internal', error.message);
    }
  });

/**
 * Firestore TTL Policy (simpler alternative - Firebase managed)
 * 
 * In Firebase Console:
 * 1. Go to Firestore Database
 * 2. Click "TTL Policy" button in upper right
 * 3. Choose a collection and a timestamp field
 * 4. Enable automatic deletion after TTL
 * 
 * Then, when saving voice messages, add a TTL field:
 * {
 *   type: 'voice',
 *   audioUrl: 'https://...',
 *   duration: 15,
 *   ts: 1234567890,
 *   ttl: admin.firestore.Timestamp.fromMillis(Date.now() + 7 * 24 * 60 * 60 * 1000)
 * }
 * 
 * Firebase will automatically delete documents when TTL expires.
 */
