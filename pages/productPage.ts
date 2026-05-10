import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './basePage';
import { parseFirstMoney, type Money } from '../utils/money';

export type ProductDetails = {
  name: string;
  unitPrice: Money;
};

export class ProductPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async browseProducts(): Promise<void> {
    await this.clickFirstVisible([
      this.page.getByRole('button', { name: /open menu/i }),
      this.page.getByRole('button', { name: /menu/i }),
    ], 'Unable to open the navigation menu.');

    await this.clickFirstVisible([
      this.page.getByRole('link', { name: /all products/i }),
      this.page.getByRole('link', { name: /shop|products/i }).first(),
    ], 'Unable to find a products navigation link.');

    await expect(this.page).toHaveURL(/products|shop|taxons|categories/i);
    await expect(this.productLinks().first(), 'Products listing should render at least one product card.').toBeVisible({ timeout: 15_000 });
    const productCount = await this.productLinks().count();
    expect(productCount, 'Product listing should expose at least one browseable product link.').toBeGreaterThan(0);
  }

  async openProduct(productName = /Drip Coffee Maker/i): Promise<ProductDetails> {
    const targetProduct = this.page.getByRole('link', { name: productName }).first();
    await expect(targetProduct, 'The expected product should be visible in the catalog.').toBeVisible({ timeout: 15_000 });
    await targetProduct.click();

    await expect(this.page).toHaveURL(/products|spree_demo/i);
    await expect(this.page.getByRole('button', { name: /add to cart/i })).toBeVisible();

    const name = await this.visibleText(this.page.locator('h1').first());
    expect(name, 'Product detail page should have a meaningful product name.').toMatch(/\w{3,}/);

    const unitPriceText = await this.firstVisibleMoneyText();
    const unitPrice = parseFirstMoney(unitPriceText);
    expect(unitPrice.amount, 'Product unit price should be greater than zero.').toBeGreaterThan(0);

    return { name, unitPrice };
  }

  async addToCart(product: ProductDetails): Promise<void> {
    await this.page.getByRole('button', { name: /add to cart/i }).click();

    const checkoutLink = this.page.getByRole('link', { name: /checkout/i });
    await expect(checkoutLink, 'Checkout entry point should be visible after adding the item to cart.').toBeVisible({ timeout: 15_000 });

    const bodyText = await this.bodyText();
    expect(bodyText, 'Cart drawer or page should keep the product name after Add to Cart.').toContain(product.name);
    expect(bodyText, 'Cart drawer or page should show at least one currency value after Add to Cart.').toMatch(/[$€£]\s?\d/);
  }

  private productLinks(): Locator {
    return this.page.locator('main a[href*="/products/"]');
  }

  private async firstVisibleMoneyText(): Promise<string> {
    const moneyLocator = this.page.locator('main').getByText(/[$€£]\s?\d/);
    const count = await moneyLocator.count();

    for (let index = 0; index < count; index += 1) {
      const current = moneyLocator.nth(index);
      if (await this.isVisible(current, 500)) {
        return current.innerText();
      }
    }

    throw new Error('Unable to find a visible product price on the product detail page.');
  }
}
