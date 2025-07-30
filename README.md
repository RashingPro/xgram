# xgram

## Using

### Installation

```shell
npm install xgram
```

### Simple bot example

```typescript
import BotClient from "xgram";

const bot = new BotClient({ token: "your_bot_token" });
bot.command("start", async (bot, message) => {
    await bot.sendMessage(message.chat.id, "Hello xgram world!", { reply_to_message_id: message.message_id });
});
```
