// api/expenses.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sheets, SPREADSHEET_ID, EXP_SHEET_NAME, findRowById, deleteRowById, checkAuth } from './googleClient';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const method = req.method;

  if (!checkAuth(req)) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    switch (method) {
      case 'POST':
        return await handlePost(req, res);
      case 'PUT':
        return await handlePut(req, res);
      case 'DELETE':
        return await handleDelete(req, res);
      default:
        res.setHeader('Allow', ['POST', 'PUT', 'DELETE']);
        return res.status(405).json({ success: false, message: `Method ${method} Not Allowed` });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

async function handlePost(req: VercelRequest, res: VercelResponse) {
  const { title, date, cost } = req.body;

  if (!title || !date || cost === undefined) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  const newId = Date.now();

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${EXP_SHEET_NAME}!A:D`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[newId, title, date, cost]],
    },
  });

  return res.status(200).json({ success: true, id: newId });
}

async function handlePut(req: VercelRequest, res: VercelResponse) {
  const { id, title, date, cost } = req.body;

  if (!id || !title || !date || cost === undefined) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  const rowToUpdate = await findRowById(EXP_SHEET_NAME, id);
  if (rowToUpdate === -1) throw new Error("Expense not found");

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${EXP_SHEET_NAME}!A${rowToUpdate}:D${rowToUpdate}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[id, title, date, cost]],
    },
  });

  return res.status(200).json({ success: true });
}

async function handleDelete(req: VercelRequest, res: VercelResponse) {
  const { id } = req.body;
  if (!id) return res.status(400).json({ success: false, message: 'Missing ID' });

  await deleteRowById(EXP_SHEET_NAME, id);
  return res.status(200).json({ success: true });
}