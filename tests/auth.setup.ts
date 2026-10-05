// import { test, expect } from '../fixtures/test-fixtures';


// import {
//     validUser,
// } from '../test-data/users';

// test('Authenticate', async ({ page , loginPage}) => {

//     await page.goto('https://www.saucedemo.com/');
//     await test.step('Login with valid credentials', async () => {
//         await loginPage.login(validUser.username, validUser.password);
//     });

//     await test.step('Verify successful login', async () => {
//         await expect(page).toHaveURL(
//             'https://www.saucedemo.com/inventory.html'

//         );
//         await expect(page.getByTestId('inventory-container')).toBeVisible();

//     });

//     await page.context().storageState({
//         path: 'playwright/.auth/user.json'
//     });
// });