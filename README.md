# Watch Bot

Telegram bot that delivers hourly Indian government updates in the user's native language.

Built with [Eve](https://eve.dev), Exa Monitors, Sarvam AI, Drizzle ORM, and Postgres.

## What it does

- Users chat with the bot on Telegram.
- Users pick a **preferred language** (Sarvam-supported Indian languages).
- Users subscribe to predefined **government update categories** (agriculture, weather, welfare/subsidies, jobs, education, health, business/MSME, finance/tax, infrastructure/transport).
- Exa Monitors check hourly for new updates from relevant Indian government sources (`gov.in`/`nic.in` and category-specific official domains).
- When new updates arrive, Watch Bot translates/sends a short summary with source links to subscribed users in their selected language.

## Tech stack

- **Eve** - agent framework, Telegram channel, custom webhook channel, tools/instructions
- **Sarvam AI** - LLM for chat + translation for native-language updates
- **Exa Monitors API** - hourly scheduled web monitoring with webhook delivery and dedupe
- **Drizzle ORM + Postgres** - users, subscriptions, monitor secrets, delivery dedupe
- **Bun/Node + TypeScript** - runtime/tooling

## Setup

1. Install deps

```bash
npm install
# or
bun install
```

2. Create `.env`

```env
SARVAM_API_KEY=
EXA_API_KEY=
TELEGRAM_BOT_TOKEN=
TELEGRAM_WEBHOOK_SECRET_TOKEN=
EVE_SERVER_URL=

DATABASE_URL=
DATABASE_URL_DIRECT=

TELEGRAM_ADMIN_ID=
```

3. Update DB schema (you run migrations)

```bash
npm run db:generate
npm run db:migrate
```

4. Run dev server

```bash
npm run dev
```

5. Set Telegram webhook/commands

```bash
bun run ./scripts/set-webhook.ts
bun run ./scripts/set-commands.ts
```

6. Create Exa monitors (after app is deployed/reachable at `EVE_SERVER_URL`)

```bash
npm run setup:monitors
```

This creates one shared Exa monitor per category and stores `monitorId` + `webhookSecret` in the `monitors` table.

## Telegram commands

- `/start` - choose language and get started
- `/language` - change preferred language
- `/subscribe` - pick update categories
- `/subscriptions` - view active subscriptions
- `/unsubscribe` - remove all subscriptions
- `/categories` - list available categories
- `/me` - view profile

## Webhook

Exa monitor callbacks are received at:

```text
POST /webhooks/exa
```

Implemented as an Eve custom channel route in `agent/channels/exa_webhook.ts`. The handler verifies `Exa-Signature` using the stored monitor webhook secret, dedupes delivery IDs, translates updates with Sarvam, and sends Telegram messages to matching subscribers.

## Key files

- `agent/agent.ts` - Eve agent/model config
- `agent/channels/telegram.ts` - Telegram commands, buttons, agent handoff
- `agent/channels/exa_webhook.ts` - Exa monitor webhook receiver
- `agent/tools/subscribe.ts`, `agent/tools/unsubscribe.ts` - agent tools
- `src/watch.ts` - categories, language codes, domain config
- `src/db/schema.ts` - users/monitors/deliveries schema
- `src/lib/exa.ts` - Exa monitor API helpers
- `src/lib/updates.ts` - webhook processing + translation + Telegram fanout
- `src/lib/translate.ts` - Sarvam translation helper
- `scripts/setup-monitors.ts` - create/register category monitors

## Notes

- Hackathon MVP: no rate limiting, no advanced dedupe beyond Exa + delivery ID insert.
- Monitor creation requires a public `EVE_SERVER_URL` so Exa can reach `/webhooks/exa`.
- Do not commit `.env` secrets.
