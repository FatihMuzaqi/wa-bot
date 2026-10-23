import multer from 'multer';
import ApiError from '../../utils/ApiError.js';

const allowedExtensions = new Set(['.xlsx', '.xls', '.csv']);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: Number(process.env.BROADCAST_IMPORT_MAX_MB || 10) * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    const name = String(file.originalname || '').toLowerCase();
    const extension = name.slice(name.lastIndexOf('.'));
    if (!allowedExtensions.has(extension)) {
      cb(new ApiError(422, 'File must be .xlsx, .xls, or .csv'));
      return;
    }
    cb(null, true);
  },
});

export const uploadBroadcastExcel = upload.single('file');

export default {
  uploadBroadcastExcel,
};
