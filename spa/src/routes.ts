import HomePage from "./pages/HomePage.vue";
import AboutPage from "./pages/AboutPage.vue";
import LoginPage from "./pages/LoginPage.vue";
import SignupPage from "./pages/SignupPage.vue";
import LogoutPage from "./pages/LogoutPage.vue";
import ForgotPasswordPage from "./pages/ForgotPasswordPage.vue";
import PasswordResetPage from "./pages/PasswordResetPage.vue";
import WorldBrowserPage from "./pages/world-browser/WorldBrowserPage.vue";

export default [
  { path: "/", component: HomePage, name: "home", meta: {
    title: "Welcome to Cybertown",
  } },
  { path: "/about", component: AboutPage, name: "about", meta: {
      title: "About Cybertown Revival",
    } },
  { path: "/place/:id", component: WorldBrowserPage, name: "world-browser" },
  { path: "/login", component: LoginPage, name: "login", meta: {
    title: "Login",
  } },
  { path: "/signup", component: SignupPage, name: "signup", meta: {
    title: "Immigrate",
  } },
  { path: "/logout", component: LogoutPage, name: "logout", meta: {
    title: "Logout",
  } },
  { path: "/forgot", component: ForgotPasswordPage, name: "forgot", meta: {
    title: "Forgot Password",
  } },
  { path: "/password_reset", component: PasswordResetPage, name: "password_reset", meta: {
    title: "Password Reset",
  } },
];

