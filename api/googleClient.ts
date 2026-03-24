// api/googleClient.ts
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { google } from 'googleapis';

export const SPREADSHEET_ID = '1DillpLJByP2kyqKAfPCBRbWYerg4golrswlEGx0sUg0';
export const EXP_SHEET_NAME = 'Spese';
export const MARKET_SHEET_NAME = 'Mercatini';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const keyPath = join(__dirname, 'service-account.json');
const keyFile = JSON.parse(fs.readFileSync(keyPath, 'utf-8'));

const auth = new google.auth.GoogleAuth({
  credentials: keyFile,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

export const sheets = google.sheets({ version: 'v4', auth });

export async function findRowById(sheetName: string, id: string | number) {
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

export async function deleteRowById(sheetName: string, id: string | number) {
  const rowIndex = await findRowById(sheetName, id);
  if (rowIndex === -1) throw new Error("Row not found");

  const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const sheet = spreadsheet.data.sheets?.find(s => s.properties?.title === sheetName);
  const sheetId = sheet?.properties?.sheetId;

  if (sheetId === undefined) throw new Error("Sheet ID not found");

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: sheetId,
              dimension: 'ROWS',
              startIndex: rowIndex - 1,
              endIndex: rowIndex,
            },
          },
        },
      ],
    },
  });
}