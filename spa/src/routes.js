import HomePage from "./pages/HomePage.vue";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import LogoutPage from "./pages/LogoutPage";
import WorldBrowserPage from "./pages/WorldBrowserPage.vue";

export default [
    { path: "/", component: HomePage, name: "home", meta: { title: 'Welcome to Cybertown'}},
    { path: "/place/:id", component: WorldBrowserPage, name: "world-browser"},
    { path: "/login", component: LoginPage, name: "login", meta: { title: 'Login'} },
    { path: "/signup", component: SignupPage, name: "signup", meta: { title: 'Immigrate'} },
    { path: "/logout", component: LogoutPage, name: "logout", meta: { title: 'Logout'} },
    /*
    { path: "/myinfo", component: MyInfoPage, name: "myinfo", meta: { title: 'My Info'} },
    { path: "/myinfo/account", component: MyAccountPage, name: "account", meta: { title: 'My Account'} },
    { path: "/myinfo/avatar", component: MyAvatarPage, name: "avatar", meta: { title: 'My Avatar'} },
     */
];

