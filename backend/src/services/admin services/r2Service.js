// src/services/r2Service.js
const AWS = require('aws-sdk');
const bucket = process.env.R2_BUCKET_NAME;
const s3 = new AWS.S3({
  endpoint:    process.env.R2_ENDPOINT,
  accessKeyId: process.env.R2_ACCESS_KEY_ID,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  region:      'auto',
  signatureVersion: 'v4',
});

/**
 * List “folders” (common prefixes) and files under a given prefix.
 * @param {string} prefix – e.g. 'align-audio/', '' for root
 */
async function listObjects(prefix = '') {
  const params = {
    Bucket: bucket,
    Prefix: prefix,
    Delimiter: '/',        // so CommonPrefixes returns “sub‑folders”
  };
  const data = await s3.listObjectsV2(params).promise();
  return {
    folders: data.CommonPrefixes?.map(p => p.Prefix) || [],
    files:   data.Contents
                .filter(o => o.Key !== prefix)  // omit “placeholder” if any
                .map(o => ({ key: o.Key, size: o.Size })),
  };
}

module.exports = { listObjects };
