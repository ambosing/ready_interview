import { UnauthorizedException } from '@nestjs/common';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { AuthController, REFRESH_TOKEN_COOKIE_NAME } from '../src/auth/auth.controller.js';

function createResponseMock() {
  const cookies: Array<{ name: string; value: string; options: Record<string, unknown> }> = [];
  const clearedCookies: Array<{ name: string; options: Record<string, unknown> }> = [];

  return {
    cookies,
    clearedCookies,
    response: {
      cookie(name: string, value: string, options: Record<string, unknown>) {
        cookies.push({ name, value, options });
      },
      clearCookie(name: string, options: Record<string, unknown>) {
        clearedCookies.push({ name, options });
      },
    },
  };
}

describe('auth refresh-token cookie transport', () => {
  it('sets the refresh token as an HttpOnly cookie and omits it from login body', async () => {
    const controller = new AuthController({
      async login() {
        return {
          user: { id: 'user-1', email: 'jiwon@example.com', name: 'Jiwon' },
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
        };
      },
    } as any);
    const { cookies, response } = createResponseMock();

    const result = await controller.login(
      { email: 'jiwon@example.com', password: 'password123' },
      response as any,
    );

    assert.deepEqual(result, {
      data: {
        user: { id: 'user-1', email: 'jiwon@example.com', name: 'Jiwon' },
        accessToken: 'access-token',
      },
    });
    assert.equal(cookies.length, 1);
    assert.equal(cookies[0].name, REFRESH_TOKEN_COOKIE_NAME);
    assert.equal(cookies[0].value, 'refresh-token');
    assert.equal(cookies[0].options.httpOnly, true);
    assert.equal(cookies[0].options.sameSite, 'lax');
    assert.equal(cookies[0].options.path, '/api/auth');
  });

  it('reads refresh tokens from cookies, rotates them, and returns only an access token', async () => {
    const controller = new AuthController({
      async refreshToken(token: string) {
        assert.equal(token, 'old-refresh-token');
        return {
          accessToken: 'next-access-token',
          refreshToken: 'next-refresh-token',
        };
      },
    } as any);
    const { cookies, response } = createResponseMock();

    const result = await controller.refresh(
      { cookies: { [REFRESH_TOKEN_COOKIE_NAME]: 'old-refresh-token' } } as any,
      response as any,
    );

    assert.deepEqual(result, { data: { accessToken: 'next-access-token' } });
    assert.equal(cookies.length, 1);
    assert.equal(cookies[0].value, 'next-refresh-token');
  });

  it('rejects refresh requests without the refresh-token cookie', async () => {
    const controller = new AuthController({} as any);
    const { response } = createResponseMock();

    await assert.rejects(
      () => controller.refresh({ cookies: {} } as any, response as any),
      UnauthorizedException,
    );
  });

  it('clears the refresh-token cookie on logout', async () => {
    const controller = new AuthController({} as any);
    const { clearedCookies, response } = createResponseMock();

    const result = await controller.logout(response as any);

    assert.deepEqual(result, { data: { success: true } });
    assert.equal(clearedCookies.length, 1);
    assert.equal(clearedCookies[0].name, REFRESH_TOKEN_COOKIE_NAME);
    assert.equal(clearedCookies[0].options.path, '/api/auth');
  });
});
