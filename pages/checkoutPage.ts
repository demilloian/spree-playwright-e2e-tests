import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './basePage';
import type { PaymentCard, ShippingAddress, TestUser } from '../utils/testData';
import { extractMoneyValues } from '../utils/money';

export type DeliveryOption = {
  label: string;
  prices: number[];
};

export type OrderConfirmation = {
  orderNumber: string;
  message: string;
};

export class CheckoutPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async assertCheckoutLoaded(): Promise<void> {
    await expect(
      this.page,
      'User should be on checkout.',
    ).toHaveURL(/checkout|account|address|delivery|payment/i, { timeout: 20_000 });

    await expect(
      this.page.locator('body'),
      'Checkout page should show checkout content.',
    ).toContainText(/contact information|shipping address|checkout|payment|place order/i, {
      timeout: 20_000,
    });
  }

  async fillContactAndShippingAddress(
    user: TestUser,
    address: ShippingAddress,
  ): Promise<void> {
    
    const emailField = this.page.locator('input[type="email"]').first();

    if (await this.isVisible(emailField, 2_000)) {
      if (await emailField.isEnabled().catch(() => false)) {
        await emailField.fill(user.email);
      } else {
        await expect(
          emailField,
          'Logged-in checkout email should be prefilled.',
        ).toHaveValue(user.email);
      }
    }
    await this.fillIfVisible(
      this.page.getByRole('textbox', { name: /first name/i }).first(),
      address.firstName,
    );

    await this.fillIfVisible(
      this.page.getByRole('textbox', { name: /last name/i }).first(),
      address.lastName,
    );

    const addressField = this.addressLine1Field();

    await this.fillFirstVisible(
      [addressField],
      address.address1,
      'Shipping address line 1',
    );

    await expect(addressField).toHaveValue(address.address1);

    await this.fillIfVisible(
      this.page.getByRole('textbox', { name: /apartment|suite|address 2/i }).first(),
      address.address2,
    );

    const cityField = this.page.getByRole('textbox', { name: /city/i }).first();

    await this.fillFirstVisible(
      [cityField, this.page.locator('input[name*="city"]').first()],
      address.city,
      'Shipping city',
    );

    await expect(cityField).toHaveValue(address.city);

    await this.selectIfVisible(
      this.page.getByLabel(/country/i).first(),
      address.country,
    );

    await this.selectIfVisible(
      this.page.getByLabel(/state|province/i).first(),
      address.state,
    );

    const zipField = this.page.getByRole('textbox', { name: /zip|postal/i }).first();

    await this.fillFirstVisible(
      [zipField, this.page.locator('input[name*="zip"]').first()],
      address.zipCode,
      'Shipping ZIP/postal code',
    );

    await expect(zipField).toHaveValue(address.zipCode);

   const phoneField = this.page.getByRole('textbox', { name: /phone/i }).first();

    await this.fillIfVisible(phoneField, address.phone);
    await this.blurAndWaitForShippingOptions(phoneField);
    await this.waitForShippingMethod();
  }
    private async blurAndWaitForShippingOptions(field: Locator): Promise<void> {
      await field.blur().catch(() => undefined);
      await this.page.locator('body').click({ position: { x: 10, y: 10 } }).catch(() => undefined);
      await this.page.waitForTimeout(1_000);
  }

  async verifyAndSelectShippingMethod(): Promise<DeliveryOption[]> {
    await this.waitForShippingMethod();

    const bodyText = (await this.bodyText()).replace(/\s+/g, ' ');

    expect(
      bodyText,
      'Checkout should show real shipping methods, not only the Shipping Method heading.',
    ).not.toContain('Enter your shipping address to view available shipping methods');

    expect(bodyText).toMatch(/standard|premium|express|free/i);

    expect(
      bodyText,
      'Checkout should show shipping pricing.',
    ).toMatch(/\$\d+(\.\d{2})?/);

    const deliveryOptions = await this.collectDeliveryOptions();

    expect(
      deliveryOptions.length,
      'Checkout should expose delivery options after address is completed.',
    ).toBeGreaterThan(0);

    const standardOption = this.page.getByRole('radio', { name: /standard/i }).first();

    if (await this.isVisible(standardOption, 2_000)) {
      await standardOption.check();
    } else {
      await this.page.getByText(/standard/i).first().click();
    }

    await expect(
      this.page.locator('body'),
      'Selected shipping method should remain visible.',
    ).toContainText(/standard/i);

    return deliveryOptions;
  }

  async selectPaymentMethod(card: PaymentCard): Promise<string> {
    await expect(
      this.page.locator('body'),
      'Checkout should reach a payment method section.',
    ).toContainText(/payment|terms|card|place order/i, { timeout: 20_000 });

    const termsOption = this.page.getByRole('radio', {
      name: /on terms|net 30/i,
    }).first();

    if (await this.isVisible(termsOption, 2_000)) {
      await termsOption.check();

      await expect(
        this.page.locator('body'),
        'Net terms payment option should remain visible after selection.',
      ).toContainText(/on terms|net 30/i);

      return 'On terms (Net 30)';
    }

    await this.clickFirstVisible(
      [
        this.page.getByLabel(/credit card|card|stripe/i).first(),
        this.page.getByText(/credit card|card|stripe/i).first(),
      ],
      'Unable to locate a payment method option.',
    );

    await this.fillIfVisible(
      this.page.locator('input[name*="number"], input[autocomplete="cc-number"]').first(),
      card.number,
    );

    await this.fillIfVisible(
      this.page.locator('input[name*="expiry"], input[autocomplete="cc-exp"]').first(),
      card.expiry,
    );

    await this.fillIfVisible(
      this.page.locator('input[name*="verification"], input[name*="cvc"], input[autocomplete="cc-csc"]').first(),
      card.cvc,
    );

    await this.fillIfVisible(
      this.page.locator('input[name*="name"], input[autocomplete="cc-name"]').first(),
      card.name,
    );

    return 'Credit card';
  }

  async placeOrder(): Promise<OrderConfirmation> {
    await this.clickFirstVisible(
      [
        this.page.getByRole('button', { name: /place order/i }),
        this.page.getByRole('button', { name: /complete order/i }),
        this.page.getByRole('button', { name: /pay now/i }),
        this.page.getByRole('link', { name: /place order|complete order|pay now/i }),
        this.page.locator('input[type="submit"]').first(),
      ],
      'Unable to locate the final Place Order button.',
    );

    await expect(
      this.page.locator('body'),
      'Order confirmation page should show a thank-you or success message.',
    ).toContainText(/thanks for your order|thank you|success/i, { timeout: 30_000 });

    await expect(
      this.page,
      'User should be redirected to order confirmation page.',
    ).toHaveURL(/order|checkout|complete|confirmation/i);

    const confirmationText = await this.bodyText();

    const orderNumberMatch =
      confirmationText.match(/Order\s*#\s*([A-Z0-9-]+)/i) ??
      confirmationText.match(/order number\s*:?\s*([A-Z0-9-]+)/i);

    expect(
      orderNumberMatch,
      'Confirmation page should include a dynamic order number.',
    ).not.toBeNull();

    const orderNumber = orderNumberMatch?.[1] ?? '';

    expect(
      orderNumber,
      'Order number should look like a real non-empty identifier.',
    ).toMatch(/^[A-Z0-9-]{4,}$/i);

    expect(
      confirmationText,
      'Confirmation page should include post-order messaging.',
    ).toMatch(/email confirmation|order confirmation|thanks for your order|thank you/i);

    return {
      orderNumber,
      message: confirmationText,
    };
  }

  private addressLine1Field(): Locator {
    return this.page.getByRole('textbox', { name: /^address$/i }).first();
  }

private async waitForShippingMethod(): Promise<void> {
  await expect(
    this.page.locator('body'),
    'Shipping options should appear after completing the address.',
  ).toContainText(/standard|premium|express|free/i, { timeout: 45_000 });
}

  // private async isShippingMethodVisible(timeout = 1_000): Promise<boolean> {
  //   return this.page
  //     .locator('body')
  //     .filter({ hasText: /shipping method/i })
  //     .isVisible({ timeout })
  //     .catch(() => false);
  // }

  private async collectDeliveryOptions(): Promise<DeliveryOption[]> {
    const bodyText = (await this.bodyText()).replace(/\s+/g, ' ');
    const options: DeliveryOption[] = [];

    const standardMatch = bodyText.match(/Standard\s+(\$\d+(\.\d{2})?)/i);

    if (standardMatch) {
      options.push({
        label: `Standard ${standardMatch[1]}`,
        prices: extractMoneyValues(standardMatch[1]).map((money) => money.amount),
      });
    }

    const premiumMatch = bodyText.match(/Premium\s+(\$\d+(\.\d{2})?)/i);

    if (premiumMatch) {
      options.push({
        label: `Premium ${premiumMatch[1]}`,
        prices: extractMoneyValues(premiumMatch[1]).map((money) => money.amount),
      });
    }

    return options;
  }

  // private async continueCheckoutStepIfNeeded(): Promise<void> {
  //   const continueButtonCandidates = [
  //     this.page.getByRole('button', { name: /save and continue/i }).first(),
  //     this.page.getByRole('button', { name: /continue to delivery/i }).first(),
  //     this.page.getByRole('button', { name: /continue to shipping/i }).first(),
  //     this.page.getByRole('button', { name: /continue to payment/i }).first(),
  //     this.page.getByRole('button', { name: /^continue$/i }).first(),
  //     this.page.getByRole('button', { name: /use this address/i }).first(),
  //     this.page.getByRole('link', { name: /save and continue|continue|use this address/i }).first(),
  //     this.page.locator('input[type="submit"]').first(),
  //   ];

  //   for (const button of continueButtonCandidates) {
  //     if (await this.isVisible(button, 1_000)) {
  //       await button.click();
  //       await this.page.waitForLoadState('networkidle').catch(() => undefined);
  //       return;
  //     }
  //   }
  // }
}