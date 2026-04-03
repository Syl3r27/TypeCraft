import { Router, Request, Response } from 'express';
import { generateWordList } from '../utils/wordGenerator';

const router = Router();

// GET /api/words?count=50&mode=common
router.get('/', (req: Request, res: Response): void => {
  const count = Math.min(parseInt(req.query.count as string) || 50, 200);
  const mode = (req.query.mode as string) || 'common';

  const words = generateWordList(count, mode);
  res.json({ success: true, words, count: words.length });
});

export default router;
