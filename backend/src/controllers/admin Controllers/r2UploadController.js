// src/controllers/r2AdminController.js
const multer = require('multer');
const upload = multer().array('files'); // for multipart/form-data uploads

const {
  createFolder,
  uploadFilesToFolder,
  listObjects,
  headObject,
  deleteFile,
  deleteFolder
} = require('../../services/admin services/r2UploadService');

async function createFolderController(req, res, next) {
  try {
    const { prefix } = req.body;
    if (!prefix) return res.status(400).json({ error: 'prefix required' });
    const folder = await createFolder(prefix);
    res.status(201).json({ folder });
  } catch (err) {
    next(err);
  }
}

async function uploadFilesController(req, res, next) {
  try {
    const { prefix } = req.body;
    const files = req.files.map(f => ({
      originalname: f.originalname,
      buffer:       f.buffer,
      mimetype:     f.mimetype
    }));
    const uploaded = await uploadFilesToFolder(prefix, files);
    res.json({ uploaded });
  } catch (err) {
    next(err);
  }
}

async function listObjectsController(req, res, next) {
  try {
    const { prefix, continuationToken, maxKeys, search } = req.query;
    const listing = await listObjects({
      prefix,
      continuationToken,
      maxKeys: parseInt(maxKeys, 10) || undefined,
      search
    });
    res.json(listing);
  } catch (err) {
    next(err);
  }
}

async function headObjectController(req, res, next) {
  try {
    const key = decodeURIComponent(req.params.key);
    const meta = await headObject(key);
    res.json(meta);
  } catch (err) {
    next(err);
  }
}

async function deleteFileController(req, res, next) {
  try {
    const { key } = req.body;
    if (!key) return res.status(400).json({ error: 'key required' });
    const result = await deleteFile(key);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function deleteFolderController(req, res, next) {
  try {
    const { prefix } = req.body;
    if (!prefix) return res.status(400).json({ error: 'prefix required' });
    const result = await deleteFolder(prefix);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  upload, // multer middleware
  createFolderController,
  uploadFilesController,
  listObjectsController,
  headObjectController,
  deleteFileController,
  deleteFolderController
};
