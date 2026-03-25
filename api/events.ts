import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sheets, SPREADSHEET_ID, MARKET_SHEET_NAME, findRowById, deleteRowById, checkAuth } from './googleClient.js';

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
  const { name, location, date, participationCost, alreadyPaid, mapsLink } = req.body;

  // MODIFICA: Almeno uno tra name e location deve essere presente
  if ((!name && !location) || !date || participationCost === undefined) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  const newId = Date.now();
  const mLink = mapsLink || "";
  const finalName = name || "";
  const finalLocation = location || "";

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${MARKET_SHEET_NAME}!A:K`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[newId, finalName, finalLocation, date, participationCost, alreadyPaid, "", "", "", "", mLink]],
    },
  });

  return res.status(200).json({ success: true, id: newId });
}

async function handlePut(req: VercelRequest, res: VercelResponse) {
  const { id, name, location, date, participationCost, alreadyPaid, income, reminder, mapsLink } = req.body;

  // MODIFICA: Almeno uno tra name e location deve essere presente
  if (!id || (!name && !location) || !date || participationCost === undefined) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  const rowToUpdate = await findRowById(MARKET_SHEET_NAME as string, id);
  if (rowToUpdate === -1) throw new Error("Event not found");

  const incomeValue = income != null ? income : "";
  const remMsg = reminder?.message || "";
  const remDate = reminder?.date || "";
  const remTime = reminder?.time || "";
  const mLink = mapsLink || "";
  const finalName = name || "";
  const finalLocation = location || "";

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${MARKET_SHEET_NAME}!A${rowToUpdate}:K${rowToUpdate}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[id, finalName, finalLocation, date, participationCost, alreadyPaid, incomeValue, remMsg, remDate, remTime, mLink]],
    },
  });

  return res.status(200).json({ success: true });
}

async function handleDelete(req: VercelRequest, res: VercelResponse) {
  const { id } = req.body;
  if (!id) return res.status(400).json({ success: false, message: 'Missing ID' });

  await deleteRowById(MARKET_SHEET_NAME as string, id);
  return res.status(200).json({ success: true });
}