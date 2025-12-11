"use strict";
// Minimal HS256 JWT signing without external deps; works in browser (Web Crypto)
// and Node (crypto HMAC). Only supports JSON payloads and UTF-8 secrets.
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeJwtPayload = exports.createAppProbeToken = exports.verifyHs256Jwt = exports.createHs256Jwt = void 0;
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();
const base64Url = (data) => {
    const bytes = data instanceof ArrayBuffer ? new Uint8Array(data) : data;
    // eslint-disable-next-line unicorn/prefer-code-point
    let str = '';
    for (let i = 0; i < bytes.length; i += 1) {
        str += String.fromCharCode(bytes[i]);
    }
    return btoa(str).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
};
const base64UrlDecode = (input) => {
    const padded = input.replace(/-/g, '+').replace(/_/g, '/');
    const base64 = padded + '='.repeat((4 - (padded.length % 4)) % 4);
    const binary = typeof atob === 'function'
        ? atob(base64)
        : Buffer.from(base64, 'base64').toString('binary');
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
};
const base64UrlEncodeJson = (obj) => {
    const json = JSON.stringify(obj);
    return base64Url(textEncoder.encode(json));
};
const signHmacSha256 = async (secret, data) => {
    // Browser path
    if (typeof window !== 'undefined' && window.crypto?.subtle) {
        const key = await window.crypto.subtle.importKey('raw', textEncoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
        const signature = await window.crypto.subtle.sign('HMAC', key, textEncoder.encode(data));
        return base64Url(signature);
    }
    // Node path
    const { createHmac } = await Promise.resolve().then(() => __importStar(require('crypto')));
    const hmac = createHmac('sha256', secret);
    hmac.update(data);
    return hmac.digest('base64url');
};
const createHs256Jwt = async (secret, payload, options = {}) => {
    const header = { alg: 'HS256', typ: 'JWT', ...(options.header ?? {}) };
    const encodedHeader = base64UrlEncodeJson(header);
    const encodedPayload = base64UrlEncodeJson(payload);
    const unsigned = `${encodedHeader}.${encodedPayload}`;
    const signature = await signHmacSha256(secret, unsigned);
    return `${unsigned}.${signature}`;
};
exports.createHs256Jwt = createHs256Jwt;
const verifyHs256Jwt = async (token, secret) => {
    const parts = token.split('.');
    if (parts.length !== 3) {
        throw new Error('Invalid JWT format');
    }
    const [headerB64, payloadB64, signature] = parts;
    const unsigned = `${headerB64}.${payloadB64}`;
    const expected = await signHmacSha256(secret, unsigned);
    if (signature !== expected) {
        throw new Error('Invalid JWT signature');
    }
    const payloadBytes = base64UrlDecode(payloadB64);
    return JSON.parse(textDecoder.decode(payloadBytes));
};
exports.verifyHs256Jwt = verifyHs256Jwt;
const createAppProbeToken = async (appKey, expiresInSeconds = 300) => {
    const now = Math.floor(Date.now() / 1000);
    return (0, exports.createHs256Jwt)(appKey, {
        appKey,
        iat: now,
        exp: now + expiresInSeconds
    });
};
exports.createAppProbeToken = createAppProbeToken;
const decodeJwtPayload = (token) => {
    const [, payloadB64] = token.split('.');
    if (!payloadB64) {
        throw new Error('Invalid JWT format');
    }
    const padded = payloadB64 + '='.repeat((4 - (payloadB64.length % 4)) % 4);
    const json = typeof atob === 'function'
        ? atob(padded.replace(/-/g, '+').replace(/_/g, '/'))
        : Buffer.from(padded.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
    return JSON.parse(json);
};
exports.decodeJwtPayload = decodeJwtPayload;
//# sourceMappingURL=jwt.js.map