import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './basePage';
import type { TestUser } from '../utils/testData';

export class AuthPage extends BasePage {
  private readonly accountLink: Locator;
  private readonly signOutButton: Locator;

  constructor(page: Page) {
    super(page);
    this.accountLink = page.getByRole('link', { name: 'Account', exact: true });
    this.signOutButton = page.getByRole('button', { name: /sign out/i });
  }

  async ensureLoggedOut(): Promise<void> {
    if (await this.isVisible(this.signOutButton, 1_000)) {
      await this.signOutButton.click();
      await expect(this.signOutButton).toBeHidden({ timeout: 10_000 });
    }
  }

  async openSignup(): Promise<void> {
    await this.accountLink.click();
    await this.page.getByRole('link', { name: /sign up/i }).click();

    await expect(this.page).toHaveURL(/register|sign-up|signup/i);
    await expect(this.page.getByRole('button', { name: /create account/i })).toBeVisible();
  }

  async register(user: TestUser): Promise<void> {
    await this.fillFirstVisible([
      this.page.getByRole('textbox', { name: /first name/i }),
      this.page.locator('input[name*="first"]').first(),
    ], user.firstName, 'First name');

    await this.fillFirstVisible([
      this.page.getByRole('textbox', { name: /last name/i }),
      this.page.locator('input[name*="last"]').first(),
    ], user.lastName, 'Last name');

    await this.fillFirstVisible([
      this.page.getByRole('textbox', { name: /email/i }).first(),
      this.page.locator('input[type="email"]').first(),
    ], user.email, 'Email');

    await this.fillFirstVisible([
      this.page.getByRole('textbox', { name: /password/i }).first(),
      this.page.locator('input[type="password"]').first(),
    ], user.password, 'Password');

    await this.fillFirstVisible([
      this.page.getByRole('textbox', { name: /confirm password/i }),
      this.page.locator('input[type="password"]').nth(1),
    ], user.password, 'Confirm password');

    const privacyCheckbox = this.page.getByRole('checkbox', { name: /privacy policy|terms/i });
    await expect(privacyCheckbox).toBeVisible();
    await privacyCheckbox.check();
    await expect(privacyCheckbox).toBeChecked();

    await this.page.getByRole('button', { name: /create account/i }).click();

    await expect(this.signOutButton, 'New user should be automatically authenticated after registration.').toBeVisible({ timeout: 15_000 });
    await expect(this.page).toHaveURL(/account|profile|users/i);
  }

  async logout(): Promise<void> {
    await expect(this.signOutButton).toBeVisible();
    await this.signOutButton.click();
    await expect(this.signOutButton).toBeHidden({ timeout: 10_000 });
  }

  async openLogin(): Promise<void> {
    const emailInput = this.page.locator('input[type="email"]').first();
    const passwordInput = this.page.locator('input[type="password"]').first();
    const loginButton = this.page.getByRole('button', { name: /sign in|log in|login/i });

    if (
      await emailInput.isVisible().catch(() => false) &&
      await passwordInput.isVisible().catch(() => false)
    ) {
      return;
    }

    await this.accountLink.click();

    if (
      !(await emailInput.isVisible().catch(() => false)) ||
      !(await passwordInput.isVisible().catch(() => false))
    ) {
      await this.page.goto('/account');
    }

    await expect(this.page).toHaveURL(/account|login|sign-in|signin/i);
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(loginButton).toBeVisible();
  }
  async login(user: TestUser): Promise<void> {
    await this.fillFirstVisible([
      this.page.getByRole('textbox', { name: /^email$/i }),
      this.page.getByRole('textbox', { name: /email/i }).first(),
      this.page.locator('input[type="email"]').first(),
    ], user.email, 'Login email');

    await this.fillFirstVisible([
      this.page.getByRole('textbox', { name: /^password$/i }),
      this.page.getByRole('textbox', { name: /password/i }).first(),
      this.page.locator('input[type="password"]').first(),
    ], user.password, 'Login password');

    await this.page.getByRole('button', { name: /sign in|login/i }).click();

    await expect(this.signOutButton, 'Registered user should be able to sign in with the new credentials.').toBeVisible({ timeout: 15_000 });
    // await expect(this.page).not.toHaveURL(/account|login|sign-in|signin/i);
    await expect(this.page).toHaveURL(/account/i);
  }
}
