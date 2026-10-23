import multer from 'multer';
import ApiError from '../../utils/ApiError.js';

const allowedExtensions = new Set(['.pdf', '.xlsx']);
const maxFileSizeMb = Number(process.env.KNOWLEDGE_UPLOAD_MAX_MB || 10);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: maxFileSizeMb * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    const name = String(file.originalname || '').toLowerCase();
    const extension = name.slice(name.lastIndexOf('.'));

    if (!allowedExtensions.has(extension)) {
      cb(new ApiError(422, 'File must be a .pdf or .xlsx document'));
      return;
    }

    cb(null, true);
  },
});

export const uploadKnowledgeDocument = upload.single('file');

export default {
  uploadKnowledgeDocument,
};
