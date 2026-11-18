import 'server-only';
import { RekognitionClient } from '@aws-sdk/client-rekognition';

let client = null;

export function getRekognitionClient() {
  if (client) return client;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  if (!accessKeyId || !secretAccessKey) {
    throw Object.assign(new Error('Amazon Rekognition is not configured.'), { code: 'REKOGNITION_NOT_CONFIGURED' });
  }
  client = new RekognitionClient({
    region: process.env.AWS_REGION || 'ap-south-1',
    credentials: { accessKeyId, secretAccessKey },
    // Only used by the automated test harness to point at a local mock.
    ...(process.env.AWS_REKOGNITION_ENDPOINT ? { endpoint: process.env.AWS_REKOGNITION_ENDPOINT } : {}),
  });
  return client;
}

/**
 * One Rekognition collection per wedding, keyed by the immutable event UUID
 * (not the editable slug), under a prefix distinct from the original app.
 */
export function getCollectionId(eventId) {
  const prefix = (process.env.AWS_REKOGNITION_COLLECTION_PREFIX || 'jab-we-wed').replace(/[^a-zA-Z0-9_.-]/g, '-');
  const id = String(eventId || '').replace(/[^a-zA-Z0-9_.-]/g, '');
  if (!id) throw new Error('Missing event id.');
  return `${prefix}-${id}`.slice(0, 255);
}

/**
 * Similarity cut-off. Default 80 (the AWS default). The live Face Match app
 * was tuned down to 75 for recall on small faces in group shots; we stay a
 * little stricter to avoid unrelated "confident" matches. Tunable via env.
 */
export function matchThreshold() {
  const n = Number(process.env.MATCH_SIMILARITY_THRESHOLD || 80);
  return Number.isFinite(n) ? Math.min(99.5, Math.max(70, n)) : 80;
}
