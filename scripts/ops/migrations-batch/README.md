# Migrations Batch (Individual)

If the consolidated script `apply-all-migrations.sql` fails with batch-related errors
(e.g. `column "conversation_id" does not exist`), run these **one at a time** in the
Supabase SQL Editor ("New query" → paste → "Run").

## Order of Execution

Run strictly in this order:

1. **053-wave3-auto-recalc-professional-rating.sql**
2. **054-wave4-chat-messaging-foundation.sql**
3. **055-wave4-push-notifications-foundation.sql**
4. **056-wave4-client-records-foundation.sql**
5. **057-wave4-dispute-system-foundation.sql**
6. **058-wave4-multi-service-booking.sql**

## Troubleshooting

### Error: `column "conversation_id" does not exist`

This usually means one of the chat tables already exists but is incomplete
(from a previous partial run). To fix:

```sql
DROP TABLE IF EXISTS conversation_participants CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
```

Then re-run **054-wave4-chat-messaging-foundation.sql**.

### Error: `relation "conversations" does not exist`

Make sure you are running migration **054** (chat) before any code that references
`conversations`, `conversation_participants`, or `messages`.

### General tip

After each migration, check the output panel for green checkmarks before proceeding
to the next one.
