
import 'dotenv/config';

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand,
} from '@aws-sdk/client-s3';

import { getSignedUrl as getCloudFrontSignedUrl } from '@aws-sdk/cloudfront-signer';

import { readFile,stat} from 'node:fs/promises';

import { createReadStream } from 'node:fs';

import path from 'node:path';


const bucket = process.env.AWS_S3_BUCKET_NAME;

if (!process.env.AWS_REGION || !bucket) 
{
  throw new Error('Missing AWS_REGION or AWS_S3_BUCKET_NAME in .env');
}

export const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export const uploadToS3 = async ({filePath,key,contentType,}) => {

  const fileStats = await stat(filePath);  //gets information about the local file. suppose your video size is 100 MB.

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: createReadStream(filePath),
      ContentLength: fileStats.size, 
      ContentType: contentType,
    })
  );
  return key;
};


export const deleteFromS3 = async (key) => {

  if (!key) return;

  await s3.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    })
  );
};


export const createSignedMediaUrl = async (key) => {

  if (!key) return null;

  const expiresIn = 15*60; // 900 sec => 15min

  const domain = process.env.CLOUDFRONT_DOMAIN; //Your CloudFront distribution domain
  const keyPairId = process.env.CLOUDFRONT_PUBLIC_KEY_ID; //ID of the CloudFront public key used for verification
  const privateKeyPath = process.env.CLOUDFRONT_PRIVATE_KEY_PATH; //Location of the corresponding private key file


  if (!domain || !keyPairId || !privateKeyPath) 
  {
    throw new Error('Missing CloudFront configuration');
  }


  const resolvedKeyPath = path.resolve(process.cwd(), privateKeyPath);
  const privateKey = await readFile(resolvedKeyPath, 'utf8'); //Reads the file as text.
  

  const url = `https://${domain}/${key
    .split('/')
    .map(encodeURIComponent)
    .join('/')}`;

  const expiresAt = Date.now() + expiresIn * 1000;

  const playbackUrl = getCloudFrontSignedUrl({
    url,
    keyPairId,
    privateKey,
    dateLessThan: new Date(expiresAt).toISOString(),
  });

  return {
    playbackUrl,
    expiresAt,
  };
};


export const deleteS3Prefix = async (prefix) => {

  if (!prefix) 
  {
    throw new Error('S3 prefix is required');
  }

  let continuationToken;

  do {
    const listed = await s3.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      })
    );

    const objects=(listed.Contents || []).map((item) => ({ Key: item.Key })).filter((item) => item.Key);

    if (objects.length > 0) 
    {
      const deleted = await s3.send(
        new DeleteObjectsCommand({
          Bucket: bucket,
          Delete: {
            Objects: objects,
            Quiet: false,
          },
        })
      );

      if (deleted.Errors?.length) 
      {
        throw new Error(
          `Failed to delete ${deleted.Errors.length} S3 object(s): ${
            deleted.Errors.map((item) => `${item.Key}: ${item.Message}`).join('; ')}`);
      }
    }

    continuationToken = listed.IsTruncated ? listed.NextContinuationToken : undefined;
  }while(continuationToken);
};