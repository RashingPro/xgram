import TelegramBot, { Message } from "node-telegram-bot-api";
import { CallbackQueryStorage, CallbackQueryEntryOptions, CallbackQueryHandler } from "@/menu";

interface RegisteredCommand {
    command: string;
    handler: CommandHandler;
    options: CommandOptions;
}

type CommandHandler = (bot: BotClient, message: Message) => void;

export interface CommandOptions {
    mention: "onlyWith" | "onlyWithout" | "both";
}

const defaultCommandOptions: CommandOptions = {
    mention: "both"
};

export interface BotOptions {
    token: string;
    polling?: boolean;
    logger?: LoggerLike;
}

type LoggerLike = {
    debug: (...data: unknown[]) => void;
    log: (...data: unknown[]) => void;
    warn: (...data: unknown[]) => void;
    error: (...data: unknown[]) => void;
};

export class BotClient extends TelegramBot {
    public constructor({ token, polling = true, logger }: BotOptions) {
        super(token, { polling: polling });

        this.on("message", this.handleMessage);
        this.on("callback_query", query => {
            this.menuController.handleQuery(this, query);
        });

        this.logger = logger ?? { log: console.log, warn: console.warn, error: console.error, debug: console.debug };
    }

    private registeredCommands: RegisteredCommand[] = [];
    public readonly logger: LoggerLike;
    private readonly menuController: CallbackQueryStorage = new CallbackQueryStorage();

    private get registeredCommandsNames(): string[] {
        return this.registeredCommands.map(val => val.command);
    }

    private async handleMessage(message: Message) {
        await this.handleCommand(message);
    }

    private async handleCommand(message: Message) {
        const text = message.text;
        if (!text || !text.startsWith("/")) return;
        const split = text.split(" ");
        const commandHeader = split[0].split("@");

        let isMentioned = false;
        if (commandHeader.length > 2) return;
        if (commandHeader.length === 2) {
            const botProfile = await this.getMe();
            if (commandHeader[1] !== botProfile.username) return;
            isMentioned = true;
        }

        for (const command of this.registeredCommands) {
            if (isMentioned && command.options.mention === "onlyWithout") continue;
            if (!isMentioned && command.options.mention === "onlyWith") continue;
            if (commandHeader[0].slice(1) !== command.command) continue;

            command.handler(this, message);
            break;
        }
    }

    public command(command: string, handler: CommandHandler, options?: Partial<CommandOptions>) {
        if (this.registeredCommandsNames.includes(command))
            throw new Error("Handler for this command already registered");

        const commandObject: RegisteredCommand = {
            command: command,
            handler: handler,
            options: { ...defaultCommandOptions, ...options }
        };
        this.registeredCommands.push(commandObject);
    }
    public callbackQuery(key: string, handler: CallbackQueryHandler, options?: Partial<CallbackQueryEntryOptions>) {
        this.menuController.registerCallbackQueryHandler(key, handler, options);
    }
}
