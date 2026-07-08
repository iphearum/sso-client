var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});

// src/http.ts
var buildAuthUrl = (config) => new URL(config.probePath, config.authBaseUrl);
var buildProviderStartUrl = (config, providerKey, options) => {
  const url = new URL(`/auth/oidc/${encodeURIComponent(providerKey)}/start`, config.authBaseUrl);
  url.searchParams.set("appKey", config.appKey);
  if (options?.intent) url.searchParams.set("intent", options.intent);
  return url;
};
var fetchSignInProviders = async (config) => {
  const url = new URL("/api/sso/providers", config.authBaseUrl);
  url.searchParams.set("appKey", config.appKey);
  const fetchImpl = config.fetch ?? fetch;
  const response = await fetchImpl(url.toString());
  if (!response.ok) {
    throw new Error(`Failed to load sign-in providers (${response.status})`);
  }
  const body = await response.json();
  return (body.providers ?? []).map((provider) => ({
    ...provider,
    startUrl: new URL(provider.startUrl, config.authBaseUrl).toString(),
    iconUrl: provider.iconUrl ? new URL(provider.iconUrl, config.authBaseUrl).toString() : null
  }));
};
var refreshSessionRequest = async (config, refreshToken) => {
  const url = new URL("/auth/refresh", config.authBaseUrl);
  const fetchImpl = config.fetch ?? fetch;
  const response = await fetchImpl(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken, appKey: config.appKey })
  });
  const body = await response.json().catch(() => ({}));
  if (response.status === 202 || body?.requiresConsent) {
    throw new Error("Session refresh requires consent; sign in interactively");
  }
  if (!response.ok) {
    throw new Error(`Failed to refresh session (${response.status})`);
  }
  return body;
};
var fetchAuthorizations = async (config, session) => {
  const authUrl = new URL("/api/sso/authorizations", config.authBaseUrl);
  const fetchImpl = config.fetch ?? fetch;
  const response = await fetchImpl(authUrl.toString(), {
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      "X-SMIS-APP-KEY": config.appKey
    }
  });
  if (!response.ok) {
    throw new Error(`Failed to load authorizations (${response.status})`);
  }
  return await response.json();
};
var fetchContextAuthorizations = async (config, session) => {
  const url = new URL("/api/sso/authorizations/context", config.authBaseUrl);
  const fetchImpl = config.fetch ?? fetch;
  const response = await fetchImpl(url.toString(), {
    headers: {
      Authorization: `Bearer ${session.accessToken}`
    }
  });
  if (!response.ok) {
    throw new Error(`Failed to load contextual authorizations (${response.status})`);
  }
  return await response.json();
};
var logoutSession = async (config, session) => {
  if (!session?.refreshToken) return;
  const url = new URL("/auth/logout", config.authBaseUrl);
  const fetchImpl = config.fetch ?? fetch;
  try {
    await fetchImpl(url.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: session.refreshToken })
    });
  } catch (error) {
  }
};
var getAuthorizedJson = async (config, session, path, init) => {
  const url = new URL(path, config.authBaseUrl);
  const fetchImpl = config.fetch ?? fetch;
  const response = await fetchImpl(url.toString(), {
    ...init,
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      ...init?.headers ?? {}
    }
  });
  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`);
  }
  return await response.json();
};
var fetchServiceSessions = async (config, session) => getAuthorizedJson(config, session, "/api/sessions");
var fetchServiceSessionGroups = async (config, session) => getAuthorizedJson(config, session, "/api/sessions/services");
var revokeServiceSession = async (config, session, serviceSessionId) => {
  await getAuthorizedJson(config, session, `/api/sessions/${encodeURIComponent(serviceSessionId)}`, {
    method: "DELETE"
  });
};
var revokeAppSessions = async (config, session, appKey) => {
  await getAuthorizedJson(config, session, `/api/sessions/apps/${encodeURIComponent(appKey)}`, {
    method: "DELETE"
  });
};

// src/storage.ts
var MemoryStorage = class {
  constructor() {
    this.store = /* @__PURE__ */ new Map();
  }
  getItem(key) {
    return this.store.has(key) ? this.store.get(key) : null;
  }
  setItem(key, value) {
    this.store.set(key, value);
  }
  removeItem(key) {
    this.store.delete(key);
  }
};
var getDefaultStorage = (preferred) => {
  if (typeof window !== "undefined") {
    if (preferred === "sessionStorage" && window.sessionStorage) return window.sessionStorage;
    if (preferred === "localStorage" && window.localStorage) return window.localStorage;
    if (!preferred || preferred === "memory") {
      if (window.localStorage) return window.localStorage;
      if (window.sessionStorage) return window.sessionStorage;
    }
  }
  return new MemoryStorage();
};
var storeSession = (storage, storageKey, session) => {
  if (!session) {
    storage.removeItem(storageKey);
    return;
  }
  storage.setItem(storageKey, JSON.stringify(session));
};
var readSession = (storage, storageKey) => {
  const value = storage.getItem(storageKey);
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch (error) {
    storage.removeItem(storageKey);
    return null;
  }
};

// src/jwt.ts
var textEncoder = new TextEncoder();
var textDecoder = new TextDecoder();
var base64Url = (data) => {
  const bytes = data instanceof ArrayBuffer ? new Uint8Array(data) : data;
  let str = "";
  for (let i = 0; i < bytes.length; i += 1) {
    str += String.fromCharCode(bytes[i]);
  }
  return btoa(str).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
};
var base64UrlDecode = (input) => {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  const base64 = padded + "=".repeat((4 - padded.length % 4) % 4);
  const binary = typeof atob === "function" ? atob(base64) : Buffer.from(base64, "base64").toString("binary");
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};
var base64UrlEncodeJson = (obj) => {
  const json = JSON.stringify(obj);
  return base64Url(textEncoder.encode(json));
};
var getNodeCrypto = () => {
  const req = typeof __require === "function" ? __require : void 0;
  if (!req) return null;
  try {
    return req("crypto");
  } catch {
    return null;
  }
};
var signHmacSha256 = async (secret, data) => {
  if (typeof window !== "undefined" && window.crypto?.subtle) {
    const key = await window.crypto.subtle.importKey(
      "raw",
      textEncoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signature = await window.crypto.subtle.sign("HMAC", key, textEncoder.encode(data));
    return base64Url(signature);
  }
  const cryptoMod = getNodeCrypto();
  if (!cryptoMod?.createHmac) {
    throw new Error("crypto.createHmac is not available");
  }
  const hmac = cryptoMod.createHmac("sha256", secret);
  hmac.update(data);
  return hmac.digest("base64url");
};
var createHs256Jwt = async (secret, payload, options = {}) => {
  const header = { alg: "HS256", typ: "JWT", ...options.header ?? {} };
  const encodedHeader = base64UrlEncodeJson(header);
  const encodedPayload = base64UrlEncodeJson(payload);
  const unsigned = `${encodedHeader}.${encodedPayload}`;
  const signature = await signHmacSha256(secret, unsigned);
  return `${unsigned}.${signature}`;
};
var verifyHs256Jwt = async (token, secret) => {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid JWT format");
  }
  const [headerB64, payloadB64, signature] = parts;
  const unsigned = `${headerB64}.${payloadB64}`;
  const expected = await signHmacSha256(secret, unsigned);
  if (signature !== expected) {
    throw new Error("Invalid JWT signature");
  }
  const payloadBytes = base64UrlDecode(payloadB64);
  return JSON.parse(textDecoder.decode(payloadBytes));
};
var createAppProbeToken = async (appKey, expiresInSeconds = 300) => {
  const now = Math.floor(Date.now() / 1e3);
  return createHs256Jwt(appKey, {
    appKey,
    iat: now,
    exp: now + expiresInSeconds
  });
};
var decodeJwtPayload = (token) => {
  const [, payloadB64] = token.split(".");
  if (!payloadB64) {
    throw new Error("Invalid JWT format");
  }
  const padded = payloadB64 + "=".repeat((4 - payloadB64.length % 4) % 4);
  const json = typeof atob === "function" ? atob(padded.replace(/-/g, "+").replace(/_/g, "/")) : Buffer.from(padded.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
  return JSON.parse(json);
};

// src/env.ts
var hasProcessEnv = typeof process !== "undefined" && !!process.env;
var dotenvConfigured = false;
var configureDotenv = () => {
  if (!hasProcessEnv || dotenvConfigured) return;
  dotenvConfigured = true;
  try {
    const req = (0, eval)('typeof require === "function" ? require : undefined');
    const dotenv = req?.("dotenv");
    if (dotenv && typeof dotenv.config === "function") {
      dotenv.config();
    }
  } catch {
  }
};
configureDotenv();
var runtimeEnv;
var getRuntimeEnv = () => {
  if (runtimeEnv) return runtimeEnv;
  if (typeof globalThis === "undefined") return void 0;
  const globalEnv = globalThis.__SMIS_ENV__ ?? globalThis.SMIS_ENV;
  return globalEnv && typeof globalEnv === "object" ? globalEnv : void 0;
};
var readEnv = (key, env) => {
  const direct = env?.[key];
  if (typeof direct === "string" && direct.length > 0) return direct;
  const runtime = getRuntimeEnv()?.[key];
  if (typeof runtime === "string" && runtime.length > 0) return runtime;
  if (!hasProcessEnv) return void 0;
  const value = process.env?.[key];
  return typeof value === "string" && value.length > 0 ? value : void 0;
};
var readEnvStringFrom = (env, ...keys) => {
  for (const key of keys) {
    const value = readEnv(key, env);
    if (value !== void 0) return value;
  }
  return void 0;
};
var readEnvNumberFrom = (env, ...keys) => {
  const raw = readEnvStringFrom(env, ...keys);
  if (!raw) return void 0;
  const value = Number(raw);
  return Number.isFinite(value) ? value : void 0;
};

// src/config.ts
var inferAppKey = (config) => {
  const runtimeEnv2 = getRuntimeEnv();
  const globalAppKey = typeof globalThis !== "undefined" ? globalThis.__SMIS_APP_KEY__ ?? globalThis.SMIS_APP_KEY ?? globalThis.APP_KEY : void 0;
  return config?.appKey ?? readEnvStringFrom(
    config?.env,
    "SMIS_APP_KEY",
    "NEXT_PUBLIC_SMIS_APP_KEY",
    "NEXTAUTH_SMIS_APP_KEY",
    "APP_KEY",
    "NEXT_PUBLIC_APP_KEY"
  ) ?? runtimeEnv2?.NEXT_PUBLIC_SMIS_APP_KEY ?? globalAppKey;
};
var inferAuthBaseUrl = (config) => config?.authBaseUrl ?? readEnvStringFrom(
  config?.env,
  "SMIS_AUTH_BASE_URL",
  "NEXT_PUBLIC_SMIS_AUTH_BASE_URL",
  "AUTH_BASE_URL",
  "NEXT_PUBLIC_AUTH_BASE_URL",
  "BASE_URL",
  "NEXT_PUBLIC_BASE_URL"
) ?? getRuntimeEnv()?.NEXT_PUBLIC_SMIS_AUTH_BASE_URL;
var inferProbePath = (config) => config?.probePath ?? readEnvStringFrom(config?.env, "SMIS_PROBE_PATH", "NEXT_PUBLIC_SMIS_PROBE_PATH");
var inferStorage = (config) => {
  const env = readEnvStringFrom(config?.env, "SMIS_STORAGE", "NEXT_PUBLIC_SMIS_STORAGE");
  const preferred = config?.storage ?? env;
  if (preferred === "sessionStorage" || preferred === "memory") return preferred;
  return "localStorage";
};
var inferStorageKey = (config, appKey) => config?.storageKey ?? readEnvStringFrom(config?.env, "SMIS_STORAGE_KEY", "NEXT_PUBLIC_SMIS_STORAGE_KEY") ?? `smis-sso:${appKey}`;
var inferTimeout = (config) => config?.timeoutMs ?? readEnvNumberFrom(config?.env, "SMIS_TIMEOUT_MS", "NEXT_PUBLIC_SMIS_TIMEOUT_MS");
var inferPollInterval = (config) => config?.pollIntervalMs ?? readEnvNumberFrom(config?.env, "SMIS_POLL_INTERVAL_MS", "NEXT_PUBLIC_SMIS_POLL_INTERVAL_MS");
var resolveConfig = (config) => {
  const appKey = inferAppKey(config);
  if (!appKey) {
    throw new Error(
      "SMIS SSO: appKey is required. Provide config.appKey or set SMIS_APP_KEY / NEXT_PUBLIC_SMIS_APP_KEY / NEXTAUTH_SMIS_APP_KEY."
    );
  }
  const authBaseUrl = inferAuthBaseUrl(config) ?? "https://accounts.itc.edu.kh";
  const probePath = inferProbePath(config) ?? "/sso/probe";
  const storage = inferStorage(config) ?? "localStorage";
  const timeoutMs = inferTimeout(config) ?? 60 * 60 * 1e3;
  const pollIntervalMs = inferPollInterval(config) ?? 60 * 1e3;
  const storageKey = inferStorageKey(config, appKey);
  return {
    ...config ?? {},
    appKey,
    authBaseUrl,
    probePath,
    storage,
    storageKey,
    timeoutMs,
    pollIntervalMs
  };
};

// src/client.ts
var AuthClient = class {
  constructor(config = {}) {
    this.config = config;
    this.resolvedConfig = resolveConfig(config);
    this.storage = getDefaultStorage(this.resolvedConfig.storage);
    this.storageKey = this.resolvedConfig.storageKey;
    this.timeoutMs = this.resolvedConfig.timeoutMs;
    this.pollIntervalMs = this.resolvedConfig.pollIntervalMs;
    this.authOrigin = new URL(this.resolvedConfig.authBaseUrl).origin;
  }
  getCachedSession() {
    const session = readSession(this.storage, this.storageKey);
    if (!session) return null;
    if (new Date(session.expiresAt).getTime() <= Date.now()) {
      storeSession(this.storage, this.storageKey, null);
      return null;
    }
    return session;
  }
  async ensureSession() {
    const cached = this.getCachedSession();
    if (cached) return cached;
    const stale = readSession(this.storage, this.storageKey);
    if (stale?.refreshToken) {
      const refreshed = await this.refreshSession(stale.refreshToken).catch(() => null);
      if (refreshed) return refreshed;
    }
    if (typeof window === "undefined") {
      throw new Error(
        "ensureSession requires a browser runtime to open the auth probe"
      );
    }
    const session = await this.launchAuthProbe();
    storeSession(this.storage, this.storageKey, session);
    return session;
  }
  /**
   * Exchanges the refresh token (given or cached) for a fresh session with no
   * user interaction. Returns null when no refresh token is available or the
   * gateway rejects it (revoked/expired/consent required).
   */
  async refreshSession(refreshToken) {
    const token = refreshToken ?? readSession(this.storage, this.storageKey)?.refreshToken;
    if (!token) return null;
    try {
      const session = await refreshSessionRequest(this.resolvedConfig, token);
      storeSession(this.storage, this.storageKey, session);
      return session;
    } catch (error) {
      if (!refreshToken) this.clearSession();
      return null;
    }
  }
  async loadAuthorizations(session) {
    const resolvedSession = session ?? await this.ensureSession();
    return fetchAuthorizations(this.resolvedConfig, resolvedSession);
  }
  async loadContextAuthorizations(session) {
    const resolvedSession = session ?? await this.ensureSession();
    return fetchContextAuthorizations(this.resolvedConfig, resolvedSession);
  }
  async listSessions(session) {
    const resolvedSession = session ?? await this.ensureSession();
    return fetchServiceSessions(this.resolvedConfig, resolvedSession);
  }
  async listSessionServices(session) {
    const resolvedSession = session ?? await this.ensureSession();
    return fetchServiceSessionGroups(this.resolvedConfig, resolvedSession);
  }
  /**
   * Returns user/token info and (optionally) contextual details such as employeeId/branches.
   * Set { fetchContext: true } to include contextual authorizations.
   */
  async user(options) {
    const fetchContext = options?.fetchContext ?? false;
    const session = options?.session ?? await this.ensureSession();
    const info = this.decodeAccessToken(session.accessToken);
    if (!fetchContext) return info;
    const context = await this.loadContextAuthorizations(session);
    return { ...info, employeeId: context.employeeId, branches: context.branches };
  }
  /**
   * Clears the locally cached session only (no network calls).
   */
  clearSession() {
    storeSession(this.storage, this.storageKey, null);
  }
  /**
   * Signs in, forcing a fresh probe if `force` is true even when a cached session exists.
   */
  async signIn(options) {
    const force = options?.force ?? false;
    const prompt = options?.prompt;
    if (force) {
      this.clearSession();
    }
    if (prompt === "select_account") {
      if (typeof window === "undefined") {
        throw new Error("signIn with prompt=select_account requires a browser runtime");
      }
      const session = await this.launchAuthProbe({ prompt });
      storeSession(this.storage, this.storageKey, session);
      return session;
    }
    return this.ensureSession();
  }
  /**
   * Signs out: calls the auth portal logout (best-effort) and clears all local state.
   */
  async signOut(session) {
    const current = session ?? this.getCachedSession() ?? void 0;
    await logoutSession(this.resolvedConfig, current).catch(() => void 0);
    this.clearSession();
  }
  /**
   * Switches user by clearing the current session and forcing a new sign-in.
   */
  async switchUser() {
    return this.signIn({ force: true, prompt: "select_account" });
  }
  /**
   * Signs in through a linked OIDC/social provider (e.g. 'google'), skipping
   * the password form: the popup goes straight to the identity provider and
   * resolves with the SMIS session once the gateway completes the callback.
   * The provider must be listed in the app's linked providers on the gateway.
   */
  async signInWithProvider(providerKey, options) {
    if (typeof window === "undefined") {
      throw new Error("signInWithProvider requires a browser runtime");
    }
    if (!(options?.force ?? false)) {
      const cached = this.getCachedSession();
      if (cached) return cached;
    }
    const session = await this.launchAuthProbe({
      startUrl: buildProviderStartUrl(this.resolvedConfig, providerKey)
    });
    storeSession(this.storage, this.storageKey, session);
    return session;
  }
  /**
   * Lists the sign-in options configured for this app on the gateway
   * (password-replacing primary provider and/or social buttons), so UIs can
   * render provider buttons dynamically instead of hard-coding them.
   */
  async listSignInProviders() {
    return fetchSignInProviders(this.resolvedConfig);
  }
  /**
   * Full-page redirect sign-in for environments where popups don't work
   * (in-app webviews, popup blockers, COOP-isolated pages). Navigates away to
   * the auth portal; on return, call `handleRedirectCallback()` to pick up the
   * session from the URL. Pass `providerKey` to go straight to a social IdP.
   */
  signInWithRedirect(options) {
    if (typeof window === "undefined") {
      throw new Error("signInWithRedirect requires a browser runtime");
    }
    const returnTo = options?.redirectUri ?? this.currentUrlWithoutTokens();
    const target = options?.providerKey ? buildProviderStartUrl(this.resolvedConfig, options.providerKey) : buildAuthUrl(this.resolvedConfig);
    target.searchParams.set("appKey", this.resolvedConfig.appKey);
    target.searchParams.set("redirect_uri", returnTo);
    if (options?.prompt) target.searchParams.set("prompt", options.prompt);
    window.location.assign(target.toString());
  }
  /**
   * Completes a redirect sign-in: reads the session from the current URL's
   * query string (accessToken/refreshToken/expiresAt), stores it, scrubs the
   * tokens from the address bar, and returns it. Returns null when the URL
   * carries no session (safe to call unconditionally on page load).
   */
  handleRedirectCallback(options) {
    if (typeof window === "undefined" && !options?.url) return null;
    const href = options?.url ?? window.location.href;
    const url = new URL(href);
    const accessToken = url.searchParams.get("accessToken");
    const refreshToken = url.searchParams.get("refreshToken");
    const expiresAt = url.searchParams.get("expiresAt");
    if (!accessToken || !expiresAt) return null;
    const session = {
      accessToken,
      refreshToken: refreshToken ?? void 0,
      appKey: this.resolvedConfig.appKey,
      expiresAt
    };
    storeSession(this.storage, this.storageKey, session);
    if ((options?.replaceHistory ?? true) && typeof window !== "undefined" && !options?.url) {
      url.searchParams.delete("accessToken");
      url.searchParams.delete("refreshToken");
      url.searchParams.delete("expiresAt");
      window.history.replaceState(window.history.state, "", url.toString());
    }
    return session;
  }
  currentUrlWithoutTokens() {
    const url = new URL(window.location.href);
    url.searchParams.delete("accessToken");
    url.searchParams.delete("refreshToken");
    url.searchParams.delete("expiresAt");
    return url.toString();
  }
  /**
   * Links an external provider account (e.g. a Google account) to the user
   * currently signed in at the auth portal, so both sign-in methods resolve
   * to the same SMIS account even when their emails differ. Requires an
   * active identity session at the gateway (i.e. the user signed in via the
   * popup at least once in this browser). Resolves with the link outcome;
   * inspect `result.linked` / `result.error`.
   */
  async linkProvider(providerKey) {
    if (typeof window === "undefined") {
      throw new Error("linkProvider requires a browser runtime");
    }
    return this.launchAuthProbe({
      startUrl: buildProviderStartUrl(this.resolvedConfig, providerKey, { intent: "link" }),
      expect: "smis:sso:link"
    });
  }
  async revokeSession(serviceSessionId, session) {
    const current = session ?? await this.ensureSession();
    await revokeServiceSession(this.resolvedConfig, current, serviceSessionId);
    if (current.refreshToken === serviceSessionId || current.serviceSessionId === serviceSessionId) {
      this.clearSession();
    }
  }
  async revokeCurrentAppSessions(session) {
    const current = session ?? await this.ensureSession();
    await revokeAppSessions(this.resolvedConfig, current, this.resolvedConfig.appKey);
    this.clearSession();
  }
  launchAuthProbe(options) {
    return new Promise((resolve, reject) => {
      const authUrl = options?.startUrl ?? buildAuthUrl(this.resolvedConfig);
      authUrl.searchParams.set("appKey", this.resolvedConfig.appKey);
      if (options?.prompt) {
        authUrl.searchParams.set("prompt", options.prompt);
      }
      let settled = false;
      let timeoutId;
      let intervalId;
      let popup = null;
      const cleanup = () => {
        if (timeoutId !== void 0) {
          window.clearTimeout(timeoutId);
        }
        if (intervalId !== void 0) {
          window.clearInterval(intervalId);
        }
        window.removeEventListener("message", messageHandler);
      };
      const fail = (error) => {
        if (settled) return;
        settled = true;
        cleanup();
        popup?.close();
        reject(error);
      };
      const complete = (payload) => {
        if (settled) return;
        settled = true;
        cleanup();
        popup?.close();
        resolve(payload);
      };
      const expectedType = options?.expect ?? "smis:sso:session";
      const messageHandler = (event) => {
        if (event.origin !== this.authOrigin) return;
        if (!event.data || event.data.type !== expectedType) return;
        complete(event.data.payload);
      };
      popup = window.open(
        "about:blank",
        "_blank",
        "width=580,height=640"
      );
      if (!popup) {
        fail(new Error("Unable to open auth probe window"));
        return;
      }
      const openedPopup = popup;
      createAppProbeToken(this.resolvedConfig.appKey).then((token) => {
        authUrl.searchParams.set("token", token);
      }).catch((error) => {
        console.warn("SMIS SSO: app token signing unavailable, falling back to appKey probe.", error);
      }).finally(() => {
        try {
          openedPopup.location.href = authUrl.toString();
        } catch (error) {
          fail(new Error("Unable to open auth probe window"));
        }
      });
      timeoutId = window.setTimeout(() => {
        fail(new Error("Auth probe timed out"));
      }, this.timeoutMs);
      window.addEventListener("message", messageHandler);
      intervalId = window.setInterval(() => {
        if (openedPopup.closed) {
          fail(new Error("Auth probe was closed before completing sign-in"));
        }
      }, this.pollIntervalMs);
    });
  }
  decodeAccessToken(token) {
    const payload = decodeJwtPayload(token);
    return {
      userId: String(payload.sub ?? ""),
      username: String(payload.username ?? ""),
      email: payload.email ? String(payload.email) : void 0,
      name: payload.name ? String(payload.name) : void 0,
      // appKey: String(payload.appKey ?? this.resolvedConfig.appKey),
      roles: Array.isArray(payload.roles) ? payload.roles : [],
      permissions: Array.isArray(payload.permissions) ? payload.permissions : []
    };
  }
};
var createAuthProbeResponse = (session) => {
  if (typeof window === "undefined") return;
  const message = {
    type: "smis:sso:session",
    payload: session
  };
  window.opener?.postMessage(message, window.location.origin);
};

// src/client-factory.ts
var caches = /* @__PURE__ */ new Map();
var getCache = (scope) => {
  const existing = caches.get(scope);
  if (existing) return existing;
  const created = { byKey: /* @__PURE__ */ new Map() };
  caches.set(scope, created);
  return created;
};
var stableConfigKey = (config) => {
  if (!config) return "{}";
  const sorted = Object.entries(config).sort(([a], [b]) => a.localeCompare(b));
  return JSON.stringify(Object.fromEntries(sorted));
};
var getCachedClient = (scope, provided, config, factory) => {
  if (provided) {
    const cache2 = getCache(scope);
    cache2.last = provided;
    return provided;
  }
  const cache = getCache(scope);
  const key = stableConfigKey(config);
  const fromKey = cache.byKey.get(key);
  if (fromKey) {
    cache.last = fromKey;
    return fromKey;
  }
  if (!config && cache.last) {
    return cache.last;
  }
  const created = factory(config);
  cache.byKey.set(key, created);
  cache.last = created;
  return created;
};
export {
  AuthClient,
  MemoryStorage,
  buildAuthUrl,
  buildProviderStartUrl,
  createAppProbeToken,
  createAuthProbeResponse,
  createHs256Jwt,
  decodeJwtPayload,
  fetchAuthorizations,
  fetchContextAuthorizations,
  fetchServiceSessionGroups,
  fetchServiceSessions,
  fetchSignInProviders,
  getCachedClient,
  getDefaultStorage,
  logoutSession,
  readSession,
  refreshSessionRequest,
  resolveConfig,
  revokeAppSessions,
  revokeServiceSession,
  storeSession,
  verifyHs256Jwt
};
