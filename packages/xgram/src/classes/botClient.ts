import TelegramBot from "node-telegram-bot-api";

export interface BotOptions {
    token: string;
    polling?: boolean;
}

export class BotClient extends TelegramBot {
    constructor({ token, polling = true }: BotOptions) {
        super(token, { polling: polling });
    }
}
