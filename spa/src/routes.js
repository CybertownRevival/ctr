import HomePage from "./pages/HomePage.vue";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import LogoutPage from "./pages/LogoutPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import PasswordResetPage from "./pages/PasswordResetPage";

import WorldBrowserPage from "./pages/WorldBrowserPage.vue";

import MyInfoPage from "./pages/MyInfoPage.vue";
import MyAccountPage from "./pages/myinfo/AccountPage.vue";
import MyAvatarPage from "./pages/myinfo/AvatarPage.vue";

export default [
    { path: "/", component: HomePage, name: "home", meta: { title: 'Welcome to Cybertown'}},
    { path: "/place/:id", component: WorldBrowserPage, name: "world-browser"},
    { path: "/login", component: LoginPage, name: "login", meta: { title: 'Login'} },
    { path: "/signup", component: SignupPage, name: "signup", meta: { title: 'Immigrate'} },
    { path: "/logout", component: LogoutPage, name: "logout", meta: { title: 'Logout'} },
    { path: "/forgot", component: ForgotPasswordPage, name: "forgot", meta: { title: 'Forgot Password'} },
    { path: "/password_reset", component: PasswordResetPage, name: "password_reset", meta: { title: 'Password Reset'} },
    { path: "/myinfo", component: MyInfoPage, name: "myinfo", meta: { title: 'My Info'} },
    { path: "/myinfo/account", component: MyAccountPage, name: "account", meta: { title: 'My Account'} },
    { path: "/myinfo/avatar", component: MyAvatarPage, name: "avatar", meta: { title: 'My Avatar'} },
];

