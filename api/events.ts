import type { VercelRequest, VercelResponse } from '@vercel/node';
import { appendEvent, updateEvent } from './utils_sheet';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const method = req.method;

  try {
    switch (method) {
      case 'POST':
        return await handlePost(req, res);
      case 'PUT':
        return await handlePut(req, res);
      default:
        res.setHeader('Allow', ['POST', 'PUT']);
        return res.status(405).json({ success: false, message: `Method ${method} Not Allowed` });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

async function handlePost(req: VercelRequest, res: VercelResponse) {
  const { name, location, date, participationCost, alreadyPaid } = req.body;

  if (!name || !location || !date || participationCost === undefined) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  const newId = await appendEvent(name, location, date, participationCost, alreadyPaid);
  return res.status(200).json({ success: true, id: newId });
}

async function handlePut(req: VercelRequest, res: VercelResponse) {
  const { id, name, location, date, participationCost, alreadyPaid } = req.body;

  if (!id || !name || !location || !date || participationCost === undefined) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  await updateEvent(id, name, location, date, participationCost, alreadyPaid);
  return res.status(200).json({ success: true });
}