// api/getData.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sheets, SPREADSHEET_ID, EXP_SHEET_NAME, MARKET_SHEET_NAME } from './googleClient';

function parseSheetDate(value: any): string {
  if (!value) return '';
  if (typeof value === 'number') {
    const date = new Date(Math.round((value - 25569) * 86400 * 1000));
    return date.toISOString().split('T')[0];
  }
  return value.toString();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    const [expensesRes, eventsRes] = await Promise.all([
      sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${EXP_SHEET_NAME}!A:D`,
        valueRenderOption: 'FORMATTED_VALUE',
      }),
      sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${MARKET_SHEET_NAME}!A:J`,
        valueRenderOption: 'FORMATTED_VALUE',
      })
    ]);

    const expensesRows = expensesRes.data.values || [];
    const eventsRows = eventsRes.data.values || [];

    const expenses = expensesRows.slice(1).map(row => ({
      id: row[0]?.toString() || '',
      title: row[1] || '',
      date: parseSheetDate(row[2]),
      cost: parseFloat(row[3]) || 0,
    }));

    const events = eventsRows.slice(1).map(row => {
      const reminderMsg = row[7];
      const reminderDate = parseSheetDate(row[8]);
      const reminderTime = row[9];
      
      let reminder;
      if (reminderMsg && reminderDate && reminderTime) {
        reminder = { message: reminderMsg, date: reminderDate, time: reminderTime };
      }

      return {
        id: row[0]?.toString() || '',
        name: row[1] || '',
        location: row[2] || '',
        date: parseSheetDate(row[3]),
        participationCost: parseFloat(row[4]) || 0,
        alreadyPaid: row[5] === true || row[5] === 'TRUE' || row[5] === 'true',
        income: row[6] != null && row[6] !== '' ? parseFloat(row[6]) : null,
        reminder: reminder
      };
    });

    return res.status(200).json({ success: true, expenses, events });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server error during fetch' });
  }
}