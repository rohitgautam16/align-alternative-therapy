// src/services/r2UploadService.js
const AWS = require('aws-sdk');
const crypto = require('crypto');
const path = require('path');

const bucket = process.env.R2_BUCKET_NAME;
const s3 = new AWS.S3({
  endpoint:         process.env.R2_ENDPOINT,
  accessKeyId:      process.env.R2_ACCESS_KEY_ID,
  secretAccessKey:  process.env.R2_SECRET_ACCESS_KEY,
  region:           'auto',
  signatureVersion: 'v4',
});


const CDN_URL = process.env.R2_CDN_URL; 
const IMMUTABLE_CACHE_CONTROL = 'public, max-age=31536000, immutable';

function slugifyFilenamePart(value) {
  return String(value || 'file')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'file';
}

function extensionFromMime(mimetype) {
  if (!mimetype) return '';
  if (mimetype === 'image/jpeg') return '.jpg';
  if (mimetype === 'image/png') return '.png';
  if (mimetype === 'image/webp') return '.webp';
  if (mimetype === 'image/avif') return '.avif';
  if (mimetype === 'image/gif') return '.gif';
  return '';
}

function normalizeUploadName(file) {
  const parsed = path.parse(file.originalname || 'file');
  const base = slugifyFilenamePart(parsed.name);
  const ext = (parsed.ext || extensionFromMime(file.mimetype)).toLowerCase();
  const hash = crypto
    .createHash('sha256')
    .update(file.buffer)
    .digest('hex')
    .slice(0, 10);

  return `${base}-${hash}${ext}`;
}

async function createFolder(prefix) {
  if (!prefix.endsWith('/')) prefix += '/';
  await s3.putObject({ Bucket: bucket, Key: prefix, Body: '' }).promise();
  return prefix;
}

async function uploadFilesToFolder(prefix, files) {
  if (prefix && !prefix.endsWith('/')) prefix += '/';
  const results = [];
  for (let file of files) {
    const filename = normalizeUploadName(file);
    const key = `${prefix || ''}${filename}`;
    await s3.putObject({
      Bucket:      bucket,
      Key:         key,
      Body:        file.buffer,
      ContentType: file.mimetype,
      CacheControl: file.mimetype?.startsWith('image/')
        ? IMMUTABLE_CACHE_CONTROL
        : undefined,
    }).promise();
    results.push({
      key,
      filename,
      originalName: file.originalname,
      size: file.buffer.length,
      contentType: file.mimetype,
      url: `${CDN_URL}/${key}`,
    });
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
