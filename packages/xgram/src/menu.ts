import { CallbackQuery } from "node-telegram-bot-api";
import { BotClient } from "@/classes/botClient";

export type CallbackQueryHandler = (bot: BotClient, query: CallbackQuery) => void;

export interface CallbackQueryEntryOptions {}

const defaultCallbackQueryEntryOptions: CallbackQueryEntryOptions = {};

interface CallbackQueryStorageEntry {
    key: string;
    handler: CallbackQueryHandler;
    options: CallbackQueryEntryOptions;
}

export class CallbackQueryStorage {
    private storage: Record<string, CallbackQueryStorageEntry> = {};

    private getNextQuery(query: string) {
        let number;
        try {
            number = parseInt(query);
        } catch {
            throw new Error(`String ${query} contains unexpected character`);
        }
        return (number + 1).toString();
    }

    registerCallbackQueryHandler(key: string, handler: CallbackQueryHandler, options?: Partial<CallbackQueryEntryOptions>) {
        const queries = Object.keys(this.storage);
        let newQuery = queries[queries.length - 1] ?? "0";
        while (queries.includes(newQuery)) {
            newQuery = this.getNextQuery(newQuery);
        }

        this.storage[newQuery] = { key: key, handler: handler, options: { ...defaultCallbackQueryEntryOptions, ...options } };
    }

    handleQuery(bot: BotClient, query: CallbackQuery) {
        const data = query.data;
        if (!data) return;
        try {
            const entry = this.storage[data];
            entry.handler(bot, query);
        } catch {
            throw new Error(`This query isn't registered: ${data}`);
        }
    }
}
