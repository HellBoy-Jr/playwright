import type { Page } from '@playwright/test';

/** CommerceLab uses Bearer JWT in memory (ApiClient), not cookies — page.request needs it explicitly. */
export async function authHeaders(page: Page): Promise<Record<string, string>> {
    const token = await page.evaluate(() => (window as any).authManager?.user?.token as string | undefined);
    if (!token) throw new Error('No auth token in window.authManager.user.token — login first');
    return { Authorization: `Bearer ${token}` };
}

/**
 * Parallel-safe user factory: registers a unique user via API.
 * Backend requires a complex password; seeded password123 only works for seeded users.
 */
export async function registerFreshUser(
    page: Page,
    overrides: Partial<{ username: string; displayName: string; email: string; password: string }> = {},
): Promise<{ email: string; password: string }> {
    const stamp = `${Date.now()}${Math.floor(Math.random() * 1e6)}`;
    const email = overrides.email ?? `pw_${stamp}@example.com`;
    const password = overrides.password ?? 'E2Epass123!';
    const username = overrides.username ?? `u${stamp}`.slice(0, 20);
    const resp = await page.request.post('/api/auth/register', {
        data: {
            username,
            displayName: overrides.displayName ?? 'E2E User',
            email,
            password,
            age: 25,
            address: '123 Main St, Cairo',
        },
    });
    if (!resp.ok()) throw new Error(`registerFreshUser failed: ${resp.status()} ${await resp.text()}`);
    return { email, password };
}

/**
 * Deterministic catalog picks: excludes parallel-run leftovers (PW-* products
 * created by admin tests) and gift cards. Never use page-0 raw order in tests.
 */
export async function seededProducts(page: Page, size = 50): Promise<any[]> {
    const resp = await page.request.get(`/api/products/custom?page=0&size=${size}`);
    if (!resp.ok()) throw new Error(`seededProducts failed: ${resp.status()}`);
    const content = (await resp.json()).content as any[];
    const stable = content.filter((p) => !p.isGiftCard && p.stock > 0 && !String(p.name).startsWith('PW-'));
    if (stable.length === 0) throw new Error('No stable seeded products available');
    return stable;
}
