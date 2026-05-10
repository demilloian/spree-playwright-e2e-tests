export type TestUser = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

export type ShippingAddress = {
  firstName: string;
  lastName: string;
  address1: string;
  address2: string;
  city: string;
  country: string;
  state: string;
  zipCode: string;
  phone: string;
};

export type PaymentCard = {
  number: string;
  expiry: string;
  cvc: string;
  name: string;
};

const runId = `${Date.now()}${Math.floor(Math.random() * 1000)}`;

export const user: TestUser = {
  firstName: 'Quality',
  lastName: 'Architect',
  email: `qa.architect.${runId}@example.test`,
  password: 'Str0ngPass!2026',
};

export const address: ShippingAddress = {
  firstName: user.firstName,
  lastName: user.lastName,
  address1: '22193 Automation Avenue',
  address2: 'Suite 100',
  city: 'Woodbridge',
  country: 'United States',
  state: 'VA',
  zipCode: '22193',
  phone: '7035550100',
};

export const paymentCard: PaymentCard = {
  // Spree demo checkout usually exposes supported test cards on the payment step.
  // This is a common non-production Visa test number and must not be used for real payments.
  number: '4111111111111111',
  expiry: '12/30',
  cvc: '123',
  name: `${user.firstName} ${user.lastName}`,
};
