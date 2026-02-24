import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { AppError } from '../../infrastructure/utils/AppError';

// Configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../../public/uploads');
        // Ensure directory exists
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Unique filename: timestamp-originalName
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter (allow PDFs and Word documents)
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedMimeTypes = [
        'application/pdf',
        'application/msword', // .doc
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // .docx
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new AppError('Invalid file type! Please upload only PDF, DOC, or DOCX files.', 400) as any, false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

export const uploadMiddleware = upload.single('file');

export const uploadFile = (req: Request, res: Response, next: NextFunction) => {
    if (!req.file) {
        return next(new AppError('No file uploaded', 400));
    }

    // Construct public URL
    // Use relative path for storage, but return absolute URL or relative path for frontend
    const fileUrl = `/uploads/${req.file.filename}`;

    res.status(201).json({
        status: 'success',
        data: {
            fileName: req.file.originalname,
            fileUrl: fileUrl,
            fileSize: req.file.size,
            mimetype: req.file.mimetype
        }
    });
};
