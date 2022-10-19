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
import BlockTools from "@/pages/block/BlockTools.vue";

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
    name: "world-browser" ,
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
  {
    path: "/neighborhood/:id",
    components: {
      default: NeighborhoodPage,
      tools: NeighborhoodTools,
    },
    name: "neighborhood" ,
  },
  {
    path: "/block/:id",
    components: {
      default: BlockPage,
      tools: BlockTools,
    },
    name: "block",
  },
];

