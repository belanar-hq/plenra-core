// Google Sheets client for mosquito-poc
// Writes lead records to Google Sheets if configured
// Falls back to CSV if env vars are missing

const { google } = require('googleapis');

class GoogleSheetsClient {
  constructor() {
    this.sheetId = process.env.GOOGLE_SHEET_ID;
    this.serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    this.privateKey = process.env.GOOGLE_PRIVATE_KEY;
    this.isConfigured = this.sheetId && this.serviceAccountEmail && this.privateKey;
    this.auth = null;

    if (this.isConfigured) {
      this.initializeAuth();
    }
  }

  initializeAuth() {
    try {
      this.auth = new google.auth.JWT({
        email: this.serviceAccountEmail,
        key: this.privateKey.replace(/\\n/g, '\n'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });
    } catch (error) {
      console.error('Google Sheets auth initialization failed:', error.message);
      this.isConfigured = false;
    }
  }

  async appendLead(leadRecord) {
    if (!this.isConfigured) {
      console.log('[GoogleSheets] Not configured, skipping sheet write');
      return null;
    }

    try {
      const sheets = google.sheets({ version: 'v4', auth: this.auth });
      const range = 'LEADS!A:N';

      const values = [
        [
          leadRecord.lead_id,
          leadRecord.timestamp,
          leadRecord.source_id,
          leadRecord.city,
          leadRecord.area,
          leadRecord.messages_count,
          leadRecord.mosquito_frequency,
          leadRecord.bites_location,
          leadRecord.has_yard,
          leadRecord.has_water_source,
          leadRecord.free_text,
          leadRecord.lead_score,
          leadRecord.status,
          leadRecord.next_action
        ]
      ];

      const response = await sheets.spreadsheets.values.append({
        spreadsheetId: this.sheetId,
        range,
        valueInputOption: 'RAW',
        resource: { values }
      });

      console.log(`[GoogleSheets] Appended lead ${leadRecord.lead_id}`);
      return response.data;
    } catch (error) {
      console.error('[GoogleSheets] Append failed:', error.message);
      console.log('[GoogleSheets] Falling back to CSV only');
      return null;
    }
  }

  getStatus() {
    return {
      configured: this.isConfigured,
      sheetId: this.isConfigured ? this.sheetId : 'NOT_SET',
      email: this.isConfigured ? this.serviceAccountEmail : 'NOT_SET'
    };
  }
}

module.exports = GoogleSheetsClient;
