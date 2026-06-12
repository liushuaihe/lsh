import express, { type Request, type Response } from 'express';
import multer from 'multer';
import { performSVD, reconstruct, reconstructFast } from '../services/svdService.js';
import { parseCSV, parseExcel, detectFileType } from '../utils/matrixParser.js';
import { matrixStats } from '../utils/fileHandler.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

router.post('/parse', upload.single('file'), (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, error: 'No file uploaded' });
      return;
    }

    const filename = req.file.originalname;
    const fileType = detectFileType(filename);

    if (!fileType) {
      res.status(400).json({
        success: false,
        error: 'Unsupported file type. Please use CSV, Excel, or image file.',
      });
      return;
    }

    if (fileType === 'image') {
      res.status(400).json({
        success: false,
        error: 'Image files should be parsed client-side via Canvas. Use the /parse-json endpoint with a pre-parsed matrix.',
      });
      return;
    }

    let parsed;
    if (fileType === 'csv') {
      parsed = parseCSV(req.file.buffer);
    } else {
      parsed = parseExcel(req.file.buffer);
    }

    if (!parsed.matrix.length || !parsed.matrix[0].length) {
      res.status(400).json({ success: false, error: 'File contains no valid data' });
      return;
    }

    const rows = parsed.matrix.length;
    const cols = parsed.matrix[0].length;

    res.json({
      success: true,
      matrix: parsed.matrix,
      meta: {
        filename,
        type: fileType,
        rows,
        cols,
        min: parsed.min,
        max: parsed.max,
      },
    });
  } catch (e: any) {
    console.error('Parse error:', e);
    res.status(500).json({ success: false, error: e?.message || 'Failed to parse file' });
  }
});

router.post('/parse-json', (req: Request, res: Response) => {
  try {
    const { matrix, filename, type } = req.body as {
      matrix?: number[][];
      filename?: string;
      type?: 'csv' | 'excel' | 'image';
    };

    if (!matrix || !Array.isArray(matrix) || !matrix.length || !Array.isArray(matrix[0])) {
      res.status(400).json({ success: false, error: 'Invalid matrix data' });
      return;
    }

    const { min, max } = matrixStats(matrix);
    const rows = matrix.length;
    const cols = matrix[0].length;

    res.json({
      success: true,
      matrix,
      meta: {
        filename: filename || 'data.json',
        type: type || 'image',
        rows,
        cols,
        min,
        max,
      },
    });
  } catch (e: any) {
    console.error('JSON parse error:', e);
    res.status(500).json({ success: false, error: e?.message || 'Failed to parse JSON matrix' });
  }
});

router.post('/decompose', (req: Request, res: Response) => {
  try {
    const { matrix } = req.body as { matrix?: number[][] };
    if (!matrix || !Array.isArray(matrix) || !matrix.length) {
      res.status(400).json({ success: false, error: 'Invalid matrix' });
      return;
    }

    const rows = matrix.length;
    const cols = matrix[0]?.length ?? 0;
    if (rows * cols > 5_000_000) {
      res.status(400).json({
        success: false,
        error: `Matrix too large: ${rows}x${cols} = ${rows * cols} elements. Maximum is 5,000,000.`,
      });
      return;
    }

    const result = performSVD(matrix);
    res.json({ success: true, ...result });
  } catch (e: any) {
    console.error('SVD error:', e);
    res.status(500).json({ success: false, error: e?.message || 'SVD decomposition failed' });
  }
});

router.post('/reconstruct', (req: Request, res: Response) => {
  try {
    const { U, singularValues, V, original, rank } = req.body as {
      U?: number[][];
      singularValues?: number[];
      V?: number[][];
      original?: number[][];
      rank?: number;
    };

    if (!U || !singularValues || !V || !original || rank === undefined) {
      res.status(400).json({ success: false, error: 'Missing required fields' });
      return;
    }

    const result = reconstruct(U, singularValues, V, original, rank);
    res.json({ success: true, ...result });
  } catch (e: any) {
    console.error('Reconstruct error:', e);
    res.status(500).json({ success: false, error: e?.message || 'Matrix reconstruction failed' });
  }
});

router.post('/reconstruct-fast', (req: Request, res: Response) => {
  try {
    const { U, singularValues, V, rank } = req.body as {
      U?: number[][];
      singularValues?: number[];
      V?: number[][];
      rank?: number;
    };

    if (!U || !singularValues || !V || rank === undefined) {
      res.status(400).json({ success: false, error: 'Missing required fields' });
      return;
    }

    const result = reconstructFast(U, singularValues, V, rank);
    res.json({ success: true, ...result });
  } catch (e: any) {
    console.error('Fast reconstruct error:', e);
    res.status(500).json({ success: false, error: e?.message || 'Fast reconstruction failed' });
  }
});

export default router;
