import { expect, type Locator, type Page } from '@playwright/test';

export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  async navigate(path = '/'): Promise<void> {
    await this.page.goto(path);
    await expect(this.page.locator('body')).toBeVisible();
  }

  protected async isVisible(locator: Locator, timeout = 1_500): Promise<boolean> {
    try {
      await locator.first().waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  protected async clickFirstVisible(locators: Locator[], message: string): Promise<Locator> {
    for (const locator of locators) {
      if (await this.isVisible(locator)) {
        await locator.first().click();
        return locator.first();
      }
    }

    throw new Error(message);
  }

  protected async fillFirstVisible(locators: Locator[], value: string, fieldName: string): Promise<void> {
    for (const locator of locators) {
      if (await this.isVisible(locator)) {
        await locator.first().fill(value);
        return;
      }
    }

    throw new Error(`Unable to find visible field: ${fieldName}`);
  }

  protected async fillIfVisible(locator: Locator, value: string): Promise<boolean> {
    if (await this.isVisible(locator, 750)) {
      await locator.first().fill(value);
      return true;
    }

    return false;
  }

  protected async selectIfVisible(locator: Locator, value: string): Promise<boolean> {
    if (await this.isVisible(locator, 750)) {
      await locator.first().selectOption(value);
      return true;
    }

    return false;
  }

  protected async visibleText(locator: Locator, timeout = 5_000): Promise<string> {
    await locator.first().waitFor({ state: 'visible', timeout });
    return (await locator.first().innerText()).trim();
  }

  protected async bodyText(): Promise<string> {
    return this.page.locator('body').innerText();
  }
}
