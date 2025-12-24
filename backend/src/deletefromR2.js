require('dotenv').config();
const AWS = require('aws-sdk');

const s3 = new AWS.S3({
  endpoint: process.env.R2_ENDPOINT,
  accessKeyId: process.env.R2_ACCESS_KEY_ID,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  region: 'auto',
  signatureVersion: 'v4',
});

const bucket = process.env.R2_BUCKET_NAME;
const foldersToDelete = [
  'align-images/'
];

async function deleteFolderObjects(folder) {
  let isTruncated = true;
  let continuationToken;

  while (isTruncated) {
    const params = {
      Bucket: bucket,
      Prefix: folder,
      ContinuationToken: continuationToken,
    };

    const data = await s3.listObjectsV2(params).promise();

    const deleteParams = {
      Bucket: bucket,
      Delete: {
        Objects: data.Contents.map(obj => ({ Key: obj.Key })),
      },
    };

    if (deleteParams.Delete.Objects.length > 0) {
      await s3.deleteObjects(deleteParams).promise();
      console.log(`Deleted ${deleteParams.Delete.Objects.length} objects in: ${folder}`);
    } else {
      console.log(`No objects found in: ${folder}`);
    }

    isTruncated = data.IsTruncated;
    continuationToken = data.NextContinuationToken;
  }
}

async function deleteAllFolders() {
  for (const folder of foldersToDelete) {
    console.log(`\nDeleting folder: ${folder}`);
    try {
      await deleteFolderObjects(folder);
    } catch (err) {
      console.error(`❌ Error deleting folder ${folder}:`, err.message);
    }
  }

  console.log('\n✅ Done deleting all folders.');
}

deleteAllFolders();
