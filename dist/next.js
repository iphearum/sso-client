"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useNextAuthSession = exports.signOut = exports.signIn = exports.useSession = exports.NextAuthClient = void 0;
/**
 * Next.js/App Router-friendly surface that mirrors `next-auth/react` while
 * keeping SMIS SSO in sync. This allows apps to swap imports to
 * `@smis/sso-client/next` with minimal code changes.
 */
var next_auth_1 = require("./next-auth");
Object.defineProperty(exports, "NextAuthClient", { enumerable: true, get: function () { return next_auth_1.NextAuthClient; } });
Object.defineProperty(exports, "useSession", { enumerable: true, get: function () { return next_auth_1.useSession; } });
// Re-export NextAuth helpers so consumers can swap the import path without
// refactoring their components.
var next_auth_2 = require("./next-auth");
Object.defineProperty(exports, "signIn", { enumerable: true, get: function () { return next_auth_2.signIn; } });
Object.defineProperty(exports, "signOut", { enumerable: true, get: function () { return next_auth_2.signOut; } });
Object.defineProperty(exports, "useNextAuthSession", { enumerable: true, get: function () { return next_auth_2.useSession; } });
//# sourceMappingURL=next.js.map