import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sheets, SPREADSHEET_ID, MARKET_SHEET_NAME, findRowById, checkAuth } from './googleClient.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!checkAuth(req)) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  if (req.method !== 'PUT') {
    res.setHeader('Allow', ['PUT']);
    return res.status(405).json({ success: false, message: `Method ${req.method} Not Allowed` });
  }

  try {
    const { id, income } = req.body;

    if (!id || income === undefined) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const rowToUpdate = await findRowById(MARKET_SHEET_NAME as string, id);
    if (rowToUpdate === -1) throw new Error("Event not found");

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${MARKET_SHEET_NAME}!G${rowToUpdate}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[parseFloat(income)]],
      },
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}