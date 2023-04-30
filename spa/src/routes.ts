import HomePage from "./pages/HomePage.vue";
import AboutPage from "./pages/AboutPage.vue";
import LoginPage from "./pages/LoginPage.vue";
import SignupPage from "./pages/SignupPage.vue";
import LogoutPage from "./pages/LogoutPage.vue";
import ForgotPasswordPage from "./pages/ForgotPasswordPage.vue";
import PasswordResetPage from "./pages/PasswordResetPage.vue";
import WorldBrowserPage from "./pages/world-browser/WorldBrowserPage.vue";
import WorldBrowserTools from "./pages/world-browser/WorldBrowserTools.vue";
import CityMapPage from "./pages/CityMapPage.vue";
import NeighborhoodPage from "./pages/neighborhood/NeighborhoodPage.vue";
import NeighborhoodTools from "@/pages/neighborhood/NeighborhoodTools.vue";

import BlockPage from "./pages/block/BlockPage.vue";
import BlockMovePage from "./pages/block/BlockMovePage.vue";
import BlockTools from "@/pages/block/BlockTools.vue";
import BlockWizardPage from "./pages/block/BlockWizardPage.vue";
import RestrictedAccess from "@/pages/RestrictedAccess.vue";

import HomeTools from "@/pages/home/HomeTools.vue";
import HomeUpdatePage from "@/pages/home/HomeUpdatePage.vue";
import HomeUpdateHomePage from "@/pages/home/HomeUpdateHomePage.vue";

import MessageBoard from "@/pages/MessageBoard.vue";

export default [
  { path: "/", component: HomePage, name: "home", meta:
      {
        title: "Welcome to Cybertown",
      },
  },
  { path: "/about", component: AboutPage, name: "about", meta:
      {
        title: "About Cybertown Revival",
      },
  },
  {
    path: "/place/:id",
    components: {
      default: WorldBrowserPage,
      tools: WorldBrowserTools,
    },
    name: "world-browser",
    meta:
     {wrapper: true},
  },
  { path: "/login", component: LoginPage, name: "login", meta:
      {
        title: "Login",
      },
  },
  { path: "/signup", component: SignupPage, name: "signup", meta:
      {
        title: "Immigrate",
      },
  },
  { path: "/logout", component: LogoutPage, name: "logout", meta:
      {
        title: "Logout",
      },
  },
  {
    path: "/forgot", component: ForgotPasswordPage, name: "forgot", meta: {
      title: "Forgot Password",
    },
  },
  { path: "/password_reset", component: PasswordResetPage, name: "password_reset", meta:
      {
        title: "Password Reset",
      },
  },
  { path: "/citymap", component: CityMapPage, name: "city_map", meta:
      {
        title: "City Map",
      },
  },
  { path: "/restricted", component: RestrictedAccess, name: "restrictedaccess", meta:
      {
        title: "Restricted Access",
      },
  },
  {
    path: "/neighborhood/:id",
    components: {
      default: NeighborhoodPage,
      tools: NeighborhoodTools,
    },
    name: "neighborhood",
    meta: { wrapper: true },
  },
  {
    path: "/block/:id/wizard",
    components: {
      default: BlockWizardPage,
      tools: BlockTools,
    },
    name: "blockwizard",
    meta: { wrapper: true },
  },
  {
    path: "/block/:id/move/:location",
    components: {
      default: BlockMovePage,
      tools: BlockTools,
    },
    name: "blockmove",
    meta: { wrapper: true },
  },
  {
    path: "/block/:id",
    components: {
      default: BlockPage,
      tools: BlockTools,
    },
    name: "block",
    meta: { wrapper: true },
  },
  {
    path: "/home/update",
    components: {
      default: HomeUpdatePage,
      tools: HomeTools,
    },
    name: "home-update",
    meta: { wrapper: true },
  },
  {
    path: "/home/update/home",
    components: {
      default: HomeUpdateHomePage,
      tools: HomeTools,
    },
    name: "home-update-home",
    meta: { wrapper: true },
  },
  {
    path: "/home/:username",
    components: {
      default: WorldBrowserPage,
      tools: HomeTools,
    },
    name: "user-home",
    meta: { wrapper: true },
  },
  {
    path: "/messageboard/:place_id",
    components: {
      default: MessageBoard,
    },
    name: "message-board",
    meta: { wrapper: false },
  },
];

