const multer = require('multer');
const path = require('node:path');
const fs = require('node:fs/promises');
const { randomUUID } = require('node:crypto');
const uploadDirectory = path.resolve(__dirname, '../../../uploads');
const parser = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 0 } }).single('photo');

function imageType(buffer) {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'jpg';
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return 'png';
  if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return 'webp';
  return null;
}
function uploadPhoto(req, res, next) {
  parser(req, res, async (error) => {
    if (error) return res.status(400).json({ success: false, message: error.code === 'LIMIT_FILE_SIZE' ? 'Photo must be 5 MB or smaller.' : 'Upload one photo using the photo field.' });
    const extension = req.file && imageType(req.file.buffer);
    if (!extension) return res.status(400).json({ success: false, message: 'Choose a JPEG, PNG or WebP photo.' });
    try {
      await fs.mkdir(uploadDirectory, { recursive: true });
      const filename = `${randomUUID()}.${extension}`;
      await fs.writeFile(path.join(uploadDirectory, filename), req.file.buffer, { flag: 'wx' });
      return res.status(201).json({ success: true, data: { photo: `/uploads/${filename}` } });
    } catch (failure) { return next(failure); }
  });
}
module.exports = { uploadPhoto, uploadDirectory, imageType };
