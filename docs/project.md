# Watch Bot

Watch Bot is a Telegram bot that sends hourly Indian government updates to users in their preferred language.

## Stack

- **Eve**: agent runtime, Telegram channel, custom webhook channel, tools, instructions
- **Sarvam AI**: chat model (`sarvam-105b`) and translation API for native-language delivery
- **Exa Monitors**: hourly scheduled monitors per category with webhook callbacks
- **Postgres + Drizzle**: users, subscriptions, monitor secrets, delivery dedupe

## Core flow

1. User starts Telegram chat, picks language via buttons, subscribes to categories.
2. `scripts/setup-monitors.ts` creates one Exa monitor per category with webhook `POST /webhooks/exa`.
3. Exa sends `monitor.run.completed` webhook hourly when new results are found.
4. `agent/channels/exa_webhook.ts` verifies signature, dedupes event, extracts updates.
5. `src/lib/updates.ts` finds subscribed users, translates summary via Sarvam, sends Telegram messages.

## Main files

- `agent/agent.ts` - model config
- `agent/channels/telegram.ts` - Telegram UX
- `agent/channels/exa_webhook.ts` - Exa webhook receiver
- `agent/tools/subscribe.ts`, `agent/tools/unsubscribe.ts` - subscription tools
- `src/watch.ts` - categories/languages/domain config
- `src/db/schema.ts` - DB schema
- `src/lib/exa.ts`, `src/lib/translate.ts`, `src/lib/updates.ts` - integrations
