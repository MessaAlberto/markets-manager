import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { google } from 'googleapis';

const SPREADSHEET_ID = '1DillpLJByP2kyqKAfPCBRbWYerg4golrswlEGx0sUg0';
const EXP_SHEET_NAME = 'Spese';
const MARKET_SHEET_NAME = 'Mercatini';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const keyPath = join(__dirname, 'service-account.json');
const keyFile = JSON.parse(fs.readFileSync(keyPath, 'utf-8'));

const getClient = () => {
  const auth = new google.auth.GoogleAuth({
    credentials: keyFile,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return google.sheets({ version: 'v4', auth });
};

async function findRowById(sheets: any, sheetName: string, id: string | number) {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A:A`,
    valueRenderOption: 'UNFORMATTED_VALUE',
  });

  const rows = response.data.values;
  if (!rows) return -1;

  const targetId = id.toString().trim();
  const rowIndex = rows.findIndex((row: any[]) => {
    if (!row[0]) return false;
    return row[0].toString().trim() === targetId;
  });

  return rowIndex !== -1 ? rowIndex + 1 : -1;
}

export const appendExpense = async (title: string, date: string, cost: number) => {
  const sheets = getClient();
  const newId = Date.now();
  
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${EXP_SHEET_NAME}!A:D`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[newId, title, date, cost]],
    },
  });

  return newId;
};

export const updateExpense = async (id: number | string, title: string, date: string, cost: number) => {
  const sheets = getClient();
  const rowToUpdate = await findRowById(sheets, EXP_SHEET_NAME, id);

  if (rowToUpdate === -1) throw new Error("Expense not found");

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${EXP_SHEET_NAME}!A${rowToUpdate}:D${rowToUpdate}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[id, title, date, cost]],
    },
  });
};

export const appendEvent = async (name: string, location: string, date: string, participationCost: number, alreadyPaid: boolean) => {
  const sheets = getClient();
  const newId = Date.now();
  
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${MARKET_SHEET_NAME}!A:F`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[newId, name, location, date, participationCost, alreadyPaid]],
    },
  });

  return newId;
};

export const updateEvent = async (id: number | string, name: string, location: string, date: string, participationCost: number, alreadyPaid: boolean) => {
  const sheets = getClient();
  const rowToUpdate = await findRowById(sheets, MARKET_SHEET_NAME, id);

  if (rowToUpdate === -1) throw new Error("Event not found");

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${MARKET_SHEET_NAME}!A${rowToUpdate}:F${rowToUpdate}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[id, name, location, date, participationCost, alreadyPaid]],
    },
  });
};