# Payment Flow

Payment processing architecture for mosquito trap installations.

## Supported Methods (Future)

- **Bit** — Israeli digital wallet
- **Paybox** — Israeli payment processor
- **Credit Card** — Visa/Mastercard via gateway
- **Green Invoice** — Israeli invoicing platform

## Payment Data Structure

Store in payment records:

| Field | Type | Description |
|-------|------|-------------|
| payment_id | string | Unique payment identifier |
| lead_id | string | Linked lead identifier |
| payment_status | enum | PENDING, COMPLETED, FAILED, REFUNDED |
| payment_amount | number | Amount in ILS (e.g., 500) |
| payment_timestamp | datetime | Payment completion time |
| payment_method | string | Bit, Paybox, Credit Card, Green Invoice |

## Flow Steps

1. **Initiate** — Send payment link/options after HIGH_PRIORITY
2. **Process** — Customer completes payment via chosen method
3. **Verify** — Gateway/webhook confirms payment
4. **Update** — Set status to PAID, trigger INSTALL_CONFIRMED
5. **Handle Failures** — Retry logic or reschedule

## Business Rules

- **Fixed Pricing** — 500 ILS (installation + first month service)
- **No Refunds** — After installation completed
- **Payment Required** — No scheduling without payment
- **Receipt Generation** — Via Green Invoice integration

## Failed Payment Handling

- **Retry Attempts** — Send 2 reminder messages
- **Status Reset** — BOOKING_PENDING → HIGH_PRIORITY after 3 days
- **Archive** — Move to CLOSED after 7 days failed

## Make.com Integration

- Webhook receivers for each payment gateway
- Status update triggers
- WhatsApp confirmation messages
- Invoice generation automation