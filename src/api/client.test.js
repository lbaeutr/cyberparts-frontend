import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import api, {
  getAccessToken,
  refreshSession,
  setAccessToken,
  setUnauthorizedHandler,
  setUserUpdateHandler,
} from "./client";

describe("api client", () => {
  let apiMock;
  let axiosMock;

  beforeEach(() => {
    apiMock = new MockAdapter(api);
    axiosMock = new MockAdapter(axios);
    setAccessToken(null);
    setUnauthorizedHandler(null);
    setUserUpdateHandler(null);
  });

  afterEach(() => {
    apiMock.restore();
    axiosMock.restore();
    setAccessToken(null);
    setUnauthorizedHandler(null);
    setUserUpdateHandler(null);
  });

  it("adds the bearer token to requests", async () => {
    setAccessToken("token-1");
    apiMock.onGet("/ping").reply(200, { ok: true });

    const response = await api.get("/ping");

    expect(response.data).toEqual({ ok: true });
    expect(apiMock.history.get[0].headers.Authorization).toBe("Bearer token-1");
  });

  it("refreshes on 401 and retries the original request", async () => {
    setAccessToken("old-token");
    apiMock.onGet("/data").replyOnce(401);
    apiMock.onGet("/data").reply(200, { ok: true });
    axiosMock.onPost("/api/auth/refresh").reply(200, { access_token: "new-token" });

    const response = await api.get("/data");

    expect(response.data).toEqual({ ok: true });
    expect(axiosMock.history.post).toHaveLength(1);
    expect(apiMock.history.get[1].headers.Authorization).toBe("Bearer new-token");
    expect(getAccessToken()).toBe("new-token");
  });

  it("uses a single refresh for concurrent 401 responses", async () => {
    axiosMock.restore();
    axiosMock = new MockAdapter(axios, { delayResponse: 20 });
    axiosMock.onPost("/api/auth/refresh").reply(200, { access_token: "new-token" });
    apiMock.onGet("/a").replyOnce(401);
    apiMock.onGet("/a").reply(200, { ok: "a" });
    apiMock.onGet("/b").replyOnce(401);
    apiMock.onGet("/b").reply(200, { ok: "b" });

    const [first, second] = await Promise.all([api.get("/a"), api.get("/b")]);

    expect(first.data).toEqual({ ok: "a" });
    expect(second.data).toEqual({ ok: "b" });
    expect(axiosMock.history.post).toHaveLength(1);
  });

  it("calls the unauthorized handler when the refresh fails", async () => {
    const onUnauthorized = vi.fn();
    setAccessToken("old-token");
    setUnauthorizedHandler(onUnauthorized);
    apiMock.onGet("/data").reply(401);
    axiosMock.onPost("/api/auth/refresh").reply(401);

    await expect(api.get("/data")).rejects.toBeTruthy();

    expect(onUnauthorized).toHaveBeenCalledTimes(1);
    expect(getAccessToken()).toBeNull();
  });

  it("keeps the session when the refresh is rate limited", async () => {
    const onUnauthorized = vi.fn();
    setAccessToken("old-token");
    setUnauthorizedHandler(onUnauthorized);
    apiMock.onGet("/data").reply(401);
    axiosMock
      .onPost("/api/auth/refresh")
      .reply(429, { detail: "Demasiados intentos. Prueba de nuevo en 12 s." });

    await expect(api.get("/data")).rejects.toMatchObject({
      response: { status: 429 },
    });

    expect(onUnauthorized).not.toHaveBeenCalled();
    expect(getAccessToken()).toBe("old-token");
  });

  it("does not try to refresh a failed login", async () => {
    apiMock.onPost("/auth/login").reply(401);

    await expect(api.post("/auth/login", {})).rejects.toBeTruthy();

    expect(axiosMock.history.post).toHaveLength(0);
  });

  it("does not try to refresh a failed oauth exchange", async () => {
    apiMock.onPost("/auth/oauth/exchange").reply(401);

    await expect(api.post("/auth/oauth/exchange", { code: "caducado" })).rejects.toBeTruthy();

    expect(axiosMock.history.post).toHaveLength(0);
  });

  it("does not retry the refresh endpoint", async () => {
    apiMock.onPost("/auth/refresh").reply(401);

    await expect(api.post("/auth/refresh", {})).rejects.toBeTruthy();

    expect(axiosMock.history.post).toHaveLength(0);
  });

  it("refreshSession stores the new access token and syncs the user", async () => {
    const onUserUpdated = vi.fn();
    setUserUpdateHandler(onUserUpdated);
    axiosMock
      .onPost("/api/auth/refresh")
      .reply(200, { access_token: "fresh", user: { username: "smith", role: "ADMIN" } });

    const data = await refreshSession();

    expect(data.access_token).toBe("fresh");
    expect(getAccessToken()).toBe("fresh");
    expect(onUserUpdated).toHaveBeenCalledWith({ username: "smith", role: "ADMIN" });
  });

  it("logs out when the user has been deactivated", async () => {
    const onUnauthorized = vi.fn();
    setAccessToken("token-1");
    setUnauthorizedHandler(onUnauthorized);
    apiMock.onGet("/data").reply(403, { detail: "Usuario desactivado" });

    await expect(api.get("/data")).rejects.toBeTruthy();

    expect(onUnauthorized).toHaveBeenCalledTimes(1);
    expect(getAccessToken()).toBeNull();
  });

  it("keeps the session on a regular 403", async () => {
    const onUnauthorized = vi.fn();
    setAccessToken("token-1");
    setUnauthorizedHandler(onUnauthorized);
    apiMock.onGet("/data").reply(403, { detail: "No tienes permisos" });

    await expect(api.get("/data")).rejects.toBeTruthy();

    expect(onUnauthorized).not.toHaveBeenCalled();
    expect(getAccessToken()).toBe("token-1");
  });
});
