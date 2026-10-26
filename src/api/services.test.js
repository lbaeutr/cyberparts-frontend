import MockAdapter from "axios-mock-adapter";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import api from "./client";
import { authApi, ordersApi, productsApi, usersApi } from "./services";

describe("api services", () => {
  let mock;

  beforeEach(() => {
    mock = new MockAdapter(api);
  });

  afterEach(() => {
    mock.restore();
  });

  it("returns product data and forwards query params", async () => {
    mock
      .onGet("/products", { params: { skip: 12, limit: 12, search: "servo" } })
      .reply(200, [{ id: 1 }]);

    await expect(productsApi.list({ skip: 12, limit: 12, search: "servo" })).resolves.toEqual([
      { id: 1 },
    ]);
  });

  it("creates, updates and removes products", async () => {
    mock.onPost("/products").reply(201, { id: 3 });
    mock.onPut("/products/3").reply(200, { id: 3, name: "Servo" });
    mock.onDelete("/products/3").reply(204);

    await expect(productsApi.create({ name: "Servo" })).resolves.toEqual({ id: 3 });
    await expect(productsApi.update(3, { name: "Servo" })).resolves.toEqual({
      id: 3,
      name: "Servo",
    });
    await expect(productsApi.remove(3)).resolves.toBeUndefined();
  });

  it("sends order filters and status updates", async () => {
    mock.onGet("/orders", { params: { status: "PAID" } }).reply(200, [{ id: 5 }]);
    mock.onPatch("/orders/5/status").reply(200, { id: 5, status: "SHIPPED" });

    await expect(ordersApi.list({ status: "PAID" })).resolves.toEqual([{ id: 5 }]);
    await expect(ordersApi.setStatus(5, "SHIPPED")).resolves.toEqual({
      id: 5,
      status: "SHIPPED",
    });
  });

  it("exchanges the oauth code", async () => {
    mock
      .onPost("/auth/oauth/exchange", { code: "oauth-code" })
      .reply(200, { access_token: "access", user: { username: "octocat" } });

    await expect(authApi.exchangeOAuth("oauth-code")).resolves.toEqual({
      access_token: "access",
      user: { username: "octocat" },
    });
  });

  it("updates users and closes the session", async () => {
    mock.onGet("/users", { params: { limit: 200 } }).reply(200, [{ id: 1 }]);
    mock.onPatch("/users/2/role").reply(200, { id: 2, role: "GESTOR" });
    mock.onPost("/auth/logout").reply(204);

    await expect(usersApi.list({ limit: 200 })).resolves.toEqual([{ id: 1 }]);
    await expect(usersApi.setRole(2, "GESTOR")).resolves.toEqual({ id: 2, role: "GESTOR" });
    await expect(authApi.logout()).resolves.toBeUndefined();
  });
});
