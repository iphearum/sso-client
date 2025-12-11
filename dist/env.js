"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readEnvNumber = exports.readEnvString = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const hasProcessEnv = typeof process !== 'undefined' && !!process.env;
const readEnv = (key) => {
    if (!hasProcessEnv)
        return undefined;
    const value = process.env?.[key];
    return typeof value === 'string' && value.length > 0 ? value : undefined;
};
const readEnvString = (...keys) => {
    for (const key of keys) {
        const value = readEnv(key);
        if (value !== undefined)
            return value;
    }
    return undefined;
};
exports.readEnvString = readEnvString;
const readEnvNumber = (...keys) => {
    const raw = (0, exports.readEnvString)(...keys);
    if (!raw)
        return undefined;
    const value = Number(raw);
    return Number.isFinite(value) ? value : undefined;
};
exports.readEnvNumber = readEnvNumber;
//# sourceMappingURL=env.js.map