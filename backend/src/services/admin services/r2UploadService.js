// src/services/r2UploadService.js
const AWS = require('aws-sdk');
const bucket = process.env.R2_BUCKET_NAME;
const s3 = new AWS.S3({
  endpoint:         process.env.R2_ENDPOINT,
  accessKeyId:      process.env.R2_ACCESS_KEY_ID,
  secretAccessKey:  process.env.R2_SECRET_ACCESS_KEY,
  region:           'auto',
  signatureVersion: 'v4',
});


const CDN_URL = process.env.R2_CDN_URL; 

async function createFolder(prefix) {
  if (!prefix.endsWith('/')) prefix += '/';
  await s3.putObject({ Bucket: bucket, Key: prefix, Body: '' }).promise();
  return prefix;
}

async function uploadFilesToFolder(prefix, files) {
  if (prefix && !prefix.endsWith('/')) prefix += '/';
  const results = [];
  for (let file of files) {
    const key = `${prefix || ''}${file.originalname}`;
    await s3.putObject({
      Bucket:      bucket,
      Key:         key,
      Body:        file.buffer,
      ContentType: file.mimetype,
    }).promise();
    results.push({ key, size: file.buffer.length });
  }
  return results;
}


async function listObjects({
  prefix = '',
  continuationToken = null,
  maxKeys = 50,
  search = ''
} = {}) {
  if (prefix && !prefix.endsWith('/')) prefix += '/';

  const params = {
    Bucket: bucket,
    Prefix: prefix,
    Delimiter: '/',
    MaxKeys: maxKeys,
  };
  if (continuationToken) params.ContinuationToken = continuationToken;

  const result = await s3.listObjectsV2(params).promise();

  // map to friendly shape, and attach full URL
  let files = (result.Contents || []).map(o => ({
    key: o.Key,
    size: o.Size,
    lastModified: o.LastModified,
    url: `${CDN_URL}/${o.Key}`
  }));

  // optional search filter
  if (search) {
    const term = search.toLowerCase();
    files = files.filter(f => f.key.toLowerCase().includes(term));
  }

  return {
    folders:     result.CommonPrefixes  || [],        // array of { Prefix }
    files,                                              // enriched objects
    isTruncated: result.IsTruncated,
    nextToken:   result.NextContinuationToken
  };
}

async function headObject(key) {
  const result = await s3.headObject({ Bucket: bucket, Key: key }).promise();
  return {
    key,
    size:         result.ContentLength,
    lastModified: result.LastModified,
    contentType:  result.ContentType,
    url:          `${CDN_URL}/${key}`
  };
}

// delete a single file
async function deleteFile(key) {
  await s3.deleteObject({ Bucket: bucket, Key: key }).promise();
  return { key };
}

// delete a folder (all objects with that prefix)
async function deleteFolder(prefix) {
  if (!prefix.endsWith('/')) prefix += '/';
  const listed = await s3.listObjectsV2({
    Bucket: bucket,
    Prefix: prefix
  }).promise();
  if (!listed.Contents.length) return { deleted: 0 };

  const objects = listed.Contents.map(o => ({ Key: o.Key }));
  const res = await s3.deleteObjects({
    Bucket: bucket,
    Delete: { Objects: objects }
  }).promise();
  return { deleted: res.Deleted.length };
}

module.exports = {
  createFolder,
  uploadFilesToFolder,
  listObjects,
  headObject,
  deleteFile,
  deleteFolder
};
