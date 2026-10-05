interface LoginData {
    username: string;
    password: string;
    expectedUrl: string;
}

const validLogin:LoginData = {

    username:'standard_user',
    password: 'secret_sauce',
    expectedUrl: 'https://www.saucedemo.com/inventory.html' 
}   