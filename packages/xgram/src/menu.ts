import { CallbackQuery, InlineKeyboardButton } from "node-telegram-bot-api";
import { BotClient } from "@/classes/botClient";
import { generateRandomString } from "@/utils";

export type CallbackQueryHandler = (bot: BotClient, query: CallbackQuery) => void;

export interface CallbackQueryEntryOptions {}

const defaultCallbackQueryEntryOptions: CallbackQueryEntryOptions = {};

interface CallbackQueryStorageEntry {
    key: string;
    query: string;
    handler: CallbackQueryHandler;
    options: CallbackQueryEntryOptions;
}

export class CallbackQueryStorage {
    private storage: CallbackQueryStorageEntry[] = [];

    private getNextQuery(query: string) {
        let number;
        try {
            number = parseInt(query);
        } catch {
            throw new Error(`String ${query} contains unexpected character`);
        }
        return (number + 1).toString();
    }

    public registerCallbackQueryHandler(
        key: string,
        handler: CallbackQueryHandler,
        options?: Partial<CallbackQueryEntryOptions>
    ) {
        const keys = this.storage.map(val => val.key);
        if (keys.includes(key)) {
            throw new Error("Callback for this key already registered");
        }

        const queries = this.storage.map(val => val.query);
        let newQuery = queries[queries.length - 1] ?? "0";
        while (queries.includes(newQuery)) {
            newQuery = this.getNextQuery(newQuery);
        }

        this.storage.push({
            key: key,
            query: newQuery,
            handler: handler,
            options: { ...defaultCallbackQueryEntryOptions, ...options }
        });

        return newQuery;
    }

    public getUniqueKey(): string {
        const keys = this.storage.map(val => val.key);
        let key = generateRandomString(10);
        while (keys.includes(key)) key = generateRandomString(10);
        return key;
    }

    public handleQuery(bot: BotClient, query: CallbackQuery) {
        const data = query.data;
        if (!data) return;
        const entry = this.storage.find(val => val.query == data);
        if (!entry) return;
        entry.handler(bot, query);
    }
}

export class InlineButtonBuilder {
    constructor(private readonly bot: BotClient) {}

    private label: string = "";
    private callbackData: string = "";

    public setLabel(label: string) {
        this.label = label;
        return this;
    }

    public setHandler(handler: CallbackQueryHandler) {
        const key = this.bot.callbackQueryStorage.getUniqueKey();
        this.callbackData = this.bot.callbackQueryStorage.registerCallbackQueryHandler(key, handler);
        return this;
    }

    public done(): InlineKeyboardButton {
        return {
            text: this.label,
            callback_data: this.callbackData
        };
    }
}
