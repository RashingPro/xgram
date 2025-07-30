import * as path from "node:path";
import * as fs from "node:fs";
import util from "node:util";

export enum LogLevel {
    DEBUG,
    INFO,
    WARNING,
    ERROR
}

export class Logger {
    constructor(public readonly logFile: string = "./latest.log") {
        try {
            const dir = path.dirname(logFile)
            fs.mkdirSync(dir, { recursive: true })

            fs.appendFileSync(logFile, "") // create a file

            const stat = fs.statSync(logFile)
            if (!stat.isFile()) throw new Error()

            fs.truncateSync(logFile, 0) // clear file

            this.logStream = fs.createWriteStream(logFile)
            this.logStream.on("error", () => {throw new Error("Failed to write log file")})
        } catch {
            throw new Error(`Invalid log file: ${logFile}. Please check path and permissions`)
        }
    }

    private readonly logStream;

    private getLogPrefix(logLevel: LogLevel) {
        const date = new Date();

        const values: [number, number][] = [
            [date.getDate(), 2],
            [date.getMonth() + 1, 2],
            [date.getFullYear(), 4],
            [date.getHours(), 2],
            [date.getMinutes(), 2],
            [date.getSeconds(), 2],
            [date.getMilliseconds(), 3]
        ];

        const formattedValues = values.map(([val, count]) => val.toString().padStart(count, "0"));
        const [day, month, year, hours, minutes, seconds, milliseconds] = formattedValues;

        let logLevelPrefix;
        switch (logLevel) {
            case LogLevel.DEBUG: {
                logLevelPrefix = "[30m[DEBUG]";
                break;
            }
            case LogLevel.INFO: {
                logLevelPrefix = "[37m[INFO]";
                break;
            }
            case LogLevel.WARNING: {
                logLevelPrefix = "[33m[WARN]";
                break;
            }
            case LogLevel.ERROR: {
                logLevelPrefix = "[31m[ERROR]";
                break;
            }
        }

        return `[33m[${day}.${month}.${year} ${hours}:${minutes}:${seconds} (${milliseconds}ms)] ${logLevelPrefix}[0m`;
    }

    private objectToString(obj: unknown) {
        return typeof obj === "string" ? obj : util.inspect(obj, { depth: null, colors: true });
    }

    private async _log(logLevel: LogLevel, ...data: unknown[]) {
        let text = "";
        for (const obj of data) {
            let toBeLogged = this.objectToString(obj);
            console.log(toBeLogged)

            if (text.length > 1) toBeLogged = " " + toBeLogged;
            toBeLogged += "[0m";
            text += toBeLogged;
        }

        text = `${this.getLogPrefix(logLevel)} ${text}`;

        let logFunc: (data: string) => void = console.log; // fallback value
        switch (logLevel) {
            case LogLevel.DEBUG: {
                logFunc = console.debug;
                break;
            }
            case LogLevel.INFO: {
                logFunc = console.log;
                break;
            }
            case LogLevel.WARNING: {
                logFunc = console.warn;
                break;
            }
            case LogLevel.ERROR: {
                logFunc = console.error;
                break;
            }
        }

        logFunc(text);
        try {
            await new Promise(resolve =>
                this.logStream.write(text + "\n", () => {resolve(null)})
            );
        } catch (err) {
            console.error("Failed to log");
            console.error(err);
        }
    }

    async debug(...data: unknown[]) {
        await this._log(LogLevel.DEBUG, ...data);
    }

    async log(...data: unknown[]) {
        await this._log(LogLevel.INFO, ...data);
    }

    async warn(...data: unknown[]) {
        await this._log(LogLevel.WARNING, ...data);
    }

    async error(...data: unknown[]) {
        await this._log(LogLevel.ERROR, ...data);
    }
}
