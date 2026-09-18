# Google Sheets Integration

Mosquito_Control_Room is the operational control room for the mosquito-poc project. All leads, installations, and renewals are tracked in this shared Google Sheet.

## Sheet Structure

- **Spreadsheet**: Mosquito_Control_Room
- **Tabs**: 
  - LEADS — All qualified leads and intake results
  - INSTALLS — Installation records and scheduling
  - RENEWALS — Service renewal tracking

## LEADS Tab Columns

| Column | Type | Description |
|--------|------|-------------|
| A | lead_id | UUID identifier |
| B | timestamp | ISO 8601 timestamp |
| C | source_id | Campaign source attribution |
| D | city | Customer city |
| E | area | Customer neighborhood |
| F | messages_count | Lead engagement count |
| G | mosquito_frequency | Frequency signal |
| H | bites_location | Bite location codes (semicolon-separated) |
| I | has_yard | Boolean (0/1) |
| J | has_water_source | Boolean (0/1) |
| K | free_text | Customer notes |
| L | lead_score | Calculated score (0-120) |
| M | status | Lead status (NEW, REVIEW, HIGH_PRIORITY, etc.) |
| N | next_action | Routing action (BOOKING_PENDING, MANUAL_REVIEW, etc.) |

## Setup: Google Cloud Service Account

### 1. Create Google Cloud Project

- Go to [Google Cloud Console](https://console.cloud.google.com/)
- Create a new project named "mosquito-poc"

### 2. Enable Sheets API

- In the project, enable Google Sheets API
- Enable Google Drive API

### 3. Create Service Account

- Go to Service Accounts in Google Cloud Console
- Create a new service account
- Name: "mosquito-poc-runtime"
- Grant no project roles (we'll use sheet-level sharing)

### 4. Create Private Key

- In Service Accounts list, click on "mosquito-poc-runtime"
- Go to KEYS tab
- Create new key (JSON format)
- Download the JSON file
- Extract:
  - `client_email` → GOOGLE_SERVICE_ACCOUNT_EMAIL
  - `private_key` → GOOGLE_PRIVATE_KEY (keep newlines escaped)

### 5. Create Google Sheet

- Create a new Google Sheet named "Mosquito_Control_Room"
- Share the sheet with the service account email
- Grant "Editor" permissions
- Get the sheet ID from the URL:
  - URL: `https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit`
  - → GOOGLE_SHEET_ID

### 6. Create LEADS Tab

- Add a new sheet tab named "LEADS"
- Add column headers (A1:N1):
  ```
  lead_id, timestamp, source_id, city, area, messages_count, mosquito_frequency, 
  bites_location, has_yard, has_water_source, free_text, lead_score, status, next_action
  ```

## Setup: Local Runtime

### 1. Install Dependencies

```bash
cd apps/mosquito-poc/runtime
npm install dotenv googleapis
```

### 2. Create .env File

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Fill in the Google Cloud credentials:

```
GOOGLE_SHEET_ID=1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p
GOOGLE_SERVICE_ACCOUNT_EMAIL=mosquito-poc-runtime@mosquito-poc-123456.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQE...\n-----END PRIVATE KEY-----\n
```

### 3. Load Environment Variables

Ensure `server.js` loads `.env`:

```bash
node server.js
```

## Operational Behavior

- **On startup**: Server logs Google Sheets connection status
- **On lead intake**: POST /intake processes lead and appends to LEADS tab
- **On failure**: Falls back to CSV write automatically
- **On retry**: Does not retry Google Sheets API (fail-fast)

## Make.com Integration

In Make.com scenarios, reference the Google Sheet as the "Control Room":

1. **Monitor for changes** — Use Google Sheets trigger on LEADS tab
2. **Read lead status** — Check LEADS for status updates
3. **Update installation date** — Write to INSTALLS tab after booking
4. **Track renewals** — Monitor RENEWALS tab for due dates

Note: The local runtime writes to Google Sheets. Make.com can read from it for downstream automation.

## Fallback Behavior

If Google Sheets credentials are missing or invalid:

- All intake data continues to be written to `data/leads.csv`
- No errors are logged to the user
- The system remains fully operational
- Later, when credentials are added, historical data remains in CSV

## Security Notes

- **Never commit credentials** — Use .env file, never commit to git
- **Rotate keys regularly** — Google Cloud service account keys
- **Minimal permissions** — Service account has only Sheets API access
- **No client secrets** — Uses JWT authentication (not OAuth)
