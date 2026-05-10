import { expect, test } from '@playwright/test';
import { AuthPage } from '../pages/authPage';
import { CartPage } from '../pages/cartPage';
import { CheckoutPage } from '../pages/checkoutPage';
import { ProductPage, type ProductDetails } from '../pages/productPage';
import { address, paymentCard, user } from '../utils/testData';

test.describe('Spree Commerce QE Challenge', () => {
  test('registers a new customer, logs in, verifies cart details, and completes checkout @e2e @checkout @allure', async ({ page }) => {
    const authPage = new AuthPage(page);
    const productPage = new ProductPage(page);
    const cartPage = new CartPage(page);
    const checkoutPage = new CheckoutPage(page);

    let selectedProduct: ProductDetails | undefined;

    await test.step('Navigate to the Spree demo store and start from a logged-out session', async () => {
      await authPage.navigate('/');
      await expect(page).toHaveURL(/demo\.spreecommerce\.org\/us\/en/i);
      await expect(page.locator('body')).toContainText(/spree|commerce|products|shop/i);
      await authPage.ensureLoggedOut();
    });

    await test.step('Sign up as a unique new user from the side account menu', async () => {
      await authPage.openSignup();
      await authPage.register(user);
    });

    await test.step('Log out and log in with the newly registered user credentials', async () => {
      await authPage.logout();
      await authPage.openLogin();
      await authPage.login(user);
    });

    await test.step('Browse catalog and open the product detail page', async () => {
      await productPage.browseProducts();
      selectedProduct = await productPage.openProduct();

      await test.info().attach('selected-product', {
        body: JSON.stringify(selectedProduct, null, 2),
        contentType: 'application/json',
      });
    });

    await test.step('Add the product to cart and verify product name, quantity, and price', async () => {
      expect(selectedProduct, 'A product should be selected before cart assertions run.').toBeDefined();
      const product = selectedProduct!;

      await productPage.addToCart(product);
      await cartPage.goToCartOrCheckout();
      await cartPage.verifyProduct(product.name, 1);
      await cartPage.proceedToCheckout();
    });

    await test.step('Fill shipping address and validate checkout page state', async () => {
      await checkoutPage.assertCheckoutLoaded();
      await checkoutPage.fillContactAndShippingAddress(user, address);
      await checkoutPage.verifyAndSelectShippingMethod();
    });

    await test.step('Verify delivery options, pricing, and select a shipping method', async () => {
      const deliveryOptions = await checkoutPage.verifyAndSelectShippingMethod();

      await test.info().attach('delivery-options', {
        body: JSON.stringify(deliveryOptions, null, 2),
        contentType: 'application/json',
      });
    });

    await test.step('Select a payment method and complete the order', async () => {
      const selectedPaymentMethod = await checkoutPage.selectPaymentMethod(paymentCard);
      expect(selectedPaymentMethod, 'Payment method should be explicitly selected before placing the order.').toMatch(/terms|card/i);

      const confirmation = await checkoutPage.placeOrder();
      expect(confirmation.orderNumber, 'Order confirmation should return a dynamic order number.').toMatch(/^[A-Z0-9-]{4,}$/i);

      await test.info().attach('order-confirmation', {
        body: JSON.stringify({ orderNumber: confirmation.orderNumber }, null, 2),
        contentType: 'application/json',
      });
    });
  });
});
