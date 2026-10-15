
import 'dotenv/config';

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const bucket = process.env.AWS_S3_BUCKET_NAME;

async function testS3() {
  const key = `connection-tests/test-${Date.now()}.txt`;

  try {
    console.log('Testing AWS S3 connection...');

    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: 'AWS S3 connection successful!',
        ContentType: 'text/plain',
      })
    );

    console.log('SUCCESS: File uploaded to S3.');

    await s3.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    );

    console.log('SUCCESS: Test file deleted.');
    console.log('AWS S3 connection is working!');
  } catch (error) {
    console.error('S3 test failed:', error.name);
    console.error('Error message:', error.message);
  } finally {
    s3.destroy();
  }
}

if (!bucket || !process.env.AWS_REGION) {
  console.error('Missing AWS_S3_BUCKET_NAME or AWS_REGION in .env');
} else {
  testS3();
}
