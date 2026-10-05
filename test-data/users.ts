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

