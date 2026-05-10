import { expect, type Page } from '@playwright/test';
import { BasePage } from './basePage';

export class CartPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  private proceedToCheckoutControl() {
    return this.page
      .locator('a, button')
      .filter({ hasText: /proceed to checkout/i })
      .first();
  }

  async goToCartOrCheckout(): Promise<void> {
    await this.clickFirstVisible(
      [
        this.page.getByRole('link', { name: /view cart/i }),
        this.page.getByRole('link', { name: /^cart$/i }),
        this.page.getByRole('link', { name: /checkout/i }),
      ],
      'Unable to open cart or checkout from the add-to-cart confirmation.',
    );

    await expect(
      this.page,
      'User should arrive on a cart or checkout URL.',
    ).toHaveURL(/cart|checkout|order/i);
  }

  async verifyProduct(productName: string, expectedQuantity = 1): Promise<void> {
    await expect(this.page).toHaveURL(/cart/i);

    await expect(this.page.getByText(productName, { exact: false }).first(),'Cart should show the selected product name.',).toBeVisible({ timeout: 15_000 });

    const cartText = (await this.page.locator('body').innerText()).replace(/\s+/g, ' ');

    expect(cartText, 'Cart should show subtotal.').toMatch(/Subtotal\s+\$\d+(\.\d{2})?/i);
    expect(cartText, 'Cart should show total.').toMatch(/Total\s+\$\d+(\.\d{2})?/i);

    expect(cartText,'Cart should show the expected quantity.',).toMatch(new RegExp(`\\b${expectedQuantity}\\b\\s+Remove`, 'i'));

    await expect(
      this.page.getByRole('link', { name: /proceed to checkout/i }),
      'Proceed to Checkout link should be visible.',
    ).toBeVisible({ timeout: 15_000 });
  }

  async proceedToCheckout(): Promise<void> {
    const checkoutLink = this.page.getByRole('link', {
      name: /proceed to checkout/i,
    });

    await expect(
      checkoutLink,
      'Proceed to Checkout link should be visible before clicking.',
    ).toBeVisible({ timeout: 15_000 });

    await checkoutLink.click();

    await expect(
      this.page,
      'User should be redirected to checkout page.',
    ).toHaveURL(/checkout|account|address|delivery|payment/i, { timeout: 20_000 });
  }
}