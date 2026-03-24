import type { VercelRequest, VercelResponse } from '@vercel/node';
import { updateEventIncome } from './utils_sheet';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'PUT') {
    res.setHeader('Allow', ['PUT']);
    return res.status(405).json({ success: false, message: `Method ${req.method} Not Allowed` });
  }

  try {
    const { id, income } = req.body;

    if (!id || income === undefined) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    await updateEventIncome(id, parseFloat(income));
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}