import HomePage from "./pages/HomePage.vue";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import LogoutPage from "./pages/LogoutPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import PasswordResetPage from "./pages/PasswordResetPage";

import WorldBrowserPage from "./pages/WorldBrowserPage.vue";


export default [
    { path: "/", component: HomePage, name: "home", meta: { title: 'Welcome to Cybertown'}},
    { path: "/place/:id", component: WorldBrowserPage, name: "world-browser"},
    { path: "/login", component: LoginPage, name: "login", meta: { title: 'Login'} },
    { path: "/signup", component: SignupPage, name: "signup", meta: { title: 'Immigrate'} },
    { path: "/logout", component: LogoutPage, name: "logout", meta: { title: 'Logout'} },
    { path: "/forgot", component: ForgotPasswordPage, name: "forgot", meta: { title: 'Forgot Password'} },
    { path: "/password_reset", component: PasswordResetPage, name: "password_reset", meta: { title: 'Password Reset'} },
];

