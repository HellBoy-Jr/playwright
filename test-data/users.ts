export interface User {
  emailId: string;
  password: string;
  expectedError: string;
  scenario: string;
}

export const validUser: User = {
  emailId: 'hassan@example.com',
  password: 'password123',
  expectedError: 'Username and password do not match',
  scenario: 'Valid User'
};

export const wrongEmail: User = {
  emailId: 'satya@example.com',
  password: 'secret_sauce',
  expectedError: 'User not found',
  scenario: 'Invalid EmailIdS'
};

export const wrongPasswordUser: User = {
  emailId: 'hassan@example.com',
  password: 'wrong_password',
  expectedError: 'Invalid Login',
  scenario: 'Incorrect Password'
};

export const adminUser = {
  emailId: 'admin@admin.com',
  password: 'admin123',
};

export const coupons = {
  valid20: 'RAMADAN20',
  invalid: 'NOT-A-CODE-123',
};

export const uniqueEmail = () => `pw_${Date.now()}_${Math.floor(Math.random() * 1e6)}@example.com`;
export const uniqueProductName = (prefix = 'PW-E2E') =>
  `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
