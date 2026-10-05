// import { test, expect } from '../fixtures/test-fixtures';
// import { LoginPage } from '../pages/LoginPage';
// import {
//   validUser,
//   invalidUser,
//   wrongPasswordUser,
//   User
// } from '../test-data/users';

// test.describe('Login Test', () => {

//   // test.describe.configure({ mode: 'serial' });

//   test.beforeEach(async ({ page }) => {
//     await page.goto('https://www.saucedemo.com/');
//   });

//   const invalidUsers: User[] = [invalidUser, wrongPasswordUser];

//   test('Successful Login', async ({ page ,loginPage}) => {
    

//     await test.step('Login with valid credentials', async () => {
//       await loginPage.login(validUser.username, validUser.password);
//     });

//     await test.step('Verify successful login', async () => {
//       await expect(page).toHaveURL(
//         'https://www.saucedemo.com/inventory.html'
  
//       );
//       await expect(page.getByTestId('inventory-container')).toBeVisible();
      
//     });
//   });

//   invalidUsers.forEach((user) => {
//     test(`Login - ${user.scenario}`, async ({ page ,loginPage}) => {
     

//       await loginPage.login(user.username, user.password);

//       await expect(page.getByTestId('error')).toBeVisible();
//       await expect(page.getByTestId('error'))
//         .toContainText(user.expectedError);
//     });
//   });

//   test.afterEach(async ({ page }) => {
//     console.log('Login Test completed');
//   });
// });

