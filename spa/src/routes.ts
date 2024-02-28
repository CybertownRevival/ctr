import HomePage from "./pages/HomePage.vue";
import AboutPage from "./pages/AboutPage.vue";
import BannedNotice from "./pages/Banned.vue";
import LoginPage from "./pages/LoginPage.vue";
import SignupPage from "./pages/SignupPage.vue";
import LogoutPage from "./pages/LogoutPage.vue";
import ForgotPasswordPage from "./pages/ForgotPasswordPage.vue";
import PasswordResetPage from "./pages/PasswordResetPage.vue";
import WorldPage from "@/pages/world-browser/WorldPage.vue";
import WorldBrowserPage from "./pages/world-browser/WorldBrowserPage.vue";
import WorldBrowserTools from "./pages/world-browser/WorldBrowserTools.vue";
import CityMapPage from "./pages/CityMapPage.vue";
import InformationPage from "./pages/Information.vue";
import NeighborhoodPage from "./pages/neighborhood/NeighborhoodPage.vue";
import NeighborhoodMapPage from "./pages/neighborhood/NeighborhoodMapPage.vue";
import NeighborhoodTools from "@/pages/neighborhood/NeighborhoodTools.vue";

import BlockPage from "./pages/block/BlockPage.vue";
import BlockMapPage from "./pages/block/BlockMapPage.vue";
import BlockMovePage from "./pages/block/BlockMovePage.vue";
import BlockTools from "@/pages/block/BlockTools.vue";
import BlockWizardPage from "./pages/block/BlockWizardPage.vue";
import RestrictedAccess from "@/pages/RestrictedAccess.vue";

import HomeTools from "@/pages/home/HomeTools.vue";
import HomeUpdatePage from "@/pages/home/HomeUpdatePage.vue";
import HomeUpdateHomePage from "@/pages/home/HomeUpdateHomePage.vue";

import MessageBoard from "@/pages/MessageBoard.vue";
import Inbox from "@/pages/Inbox.vue";

import AccessRights from "@/pages/AccessRights.vue";

import admin from "@/pages/admin/admin.vue";
import UserMain from "@/pages/admin/user/MainMenu.vue";
import UserSubMenu from "@/pages/admin/user/SubMenu.vue";
import InfoView from "@/pages/admin/user/infoview.vue";
import UserSearch from "@/pages/admin/user/search.vue";
import UserChat from "@/pages/admin/user/ChatMessages.vue";
import UserBanHistory from "@/pages/admin/user/BanHistory.vue";
import UserBanAdd from "@/pages/admin/user/BanAdd.vue";
import UserDonor from "@/pages/admin/user/donor.vue";

import MallUploadPage from "@/pages/mall/MallUploadPage.vue";
import MallApprovalPage from "@/pages/mall/MallApprovalPage.vue";
import MallShopPage from "@/pages/mall/MallShopPage.vue";

import ObjectProperties from './pages/ObjectProperties.vue';

export default [
    {
        path: "/",
        component: HomePage,
        name: "home",
        meta: {
            title: "Welcome to Cybertown",
        },
    },
    {
        path: "/about",
        component: AboutPage,
        name: "about",
        meta: {
            title: "About Cybertown Revival",
        },
    },
    {
        path: "/banned",
        component: BannedNotice,
        name: "banned",
        meta: {
            title: "Banned Notice",
        },
    },
    {
        path: "/banned",
        component: BannedNotice,
        name: "banned",
        meta: {
            title: "Banned Notice",
        },
    },
    {
        path: "/place/:id",
        components: {
            default: WorldPage,
            tools: WorldBrowserTools,
        },
        name: "world-page",
        meta: { wrapper: true },
        children: [
            {
                path: "",
                component: WorldBrowserPage,
                name: "world-browser",
                meta: { wrapper: true },
            },
            {
                path: "",
                component: AccessRights,
                name: "worldAccessRights",
                meta: { wrapper: true },
            },
        ],
    },
    {
        path: "/login",
        component: LoginPage,
        name: "login",
        meta: {
            title: "Login",
        },
    },
    {
        path: "/signup",
        component: SignupPage,
        name: "signup",
        meta: {
            title: "Immigrate",
        },
    },
    {
        path: "/logout",
        component: LogoutPage,
        name: "logout",
        meta: {
            title: "Logout",
        },
    },
    {
        path: "/forgot",
        component: ForgotPasswordPage,
        name: "forgot",
        meta: {
            title: "Forgot Password",
        },
    },
    {
        path: "/password_reset",
        component: PasswordResetPage,
        name: "password_reset",
        meta: {
            title: "Password Reset",
        },
    },
    {
        path: "/citymap",
        component: CityMapPage,
        name: "city_map",
        meta: {
            title: "City Map",
        },
    },
    {
        path: "/restricted",
        component: RestrictedAccess,
        name: "restrictedaccess",
        meta: {
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
        children: [
            {
                path: "",
                component: NeighborhoodMapPage,
                name: "neighborhoodpage",
                meta: { wrapper: true },
            },
            {
                path: "",
                component: AccessRights,
                name: "neighborhoodAccessRights",
                meta: { wrapper: true },
            },
        ],
    },
    {
        path: "/block/:id",
        components: {
            default: BlockPage,
            tools: BlockTools,
        },
        name: "block",
        meta: { wrapper: true },
        children: [
            {
                path: "",
                component: BlockMapPage,
                name: "blockmap",
                meta: { wrapper: true },
            },
            {
                path: "move/:location",
                component: BlockMovePage,
                name: "blockmove",
                meta: { wrapper: true },
            },
            {
                path: "wizard",
                component: BlockWizardPage,
                name: "blockwizard",
                meta: { wrapper: true },
            },
            {
                path: "",
                component: AccessRights,
                name: "blockaccessrights",
                meta: { wrapper: true },
            },
        ],
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
    {
        path: "/inbox/:place_id",
        components: {
            default: Inbox,
        },
        name: "inbox",
        meta: { wrapper: false },
    },
    {
        path: "/information/:type/:id",
        component: InformationPage,
        name: "information",
        meta: {
            title: "Information",
            wrapper: false,
        },
    },
    {
        path: "/admin/",
        component: admin,
        name: "Admin",
        meta: {
            title: "Admin Page",
            wrapper: false,
        },
        children: [
            {
                path: "/admin/member/",
                component: UserSearch,
                name: "UserSearch",
                meta: {
                    title: "Member Search - Admin Panel",
                },
            },
            {
                path: "/admin/member/user/:id",
                component: UserMain,
                default: UserSubMenu,
                name: "UserMain",
                meta: {
                    title: "Member Details - Admin Panel",
                },
                children: [
                    {
                        path: "",
                        component: UserSubMenu,
                        default: InfoView,
                        name: "UserSubMenu",
                        meta: {
                            title: "Member Details - Admin Panel",
                        },
                        children: [
                            {
                                path: "",
                                component: InfoView,
                                name: "UserView",
                                meta: {
                                    title: "Member Details - Admin Panel",
                                },
                            },
                            {
                                path: "/admin/member/user/:id/chat",
                                component: UserChat,
                                name: "UserChat",
                                meta: {
                                    title: "Member Chat - Admin Panel",
                                },
                            },
                            {
                                path: "/admin/member/user/:id/ban",
                                component: UserBanHistory,
                                name: "UserBanHistory",
                                meta: {
                                    title: "Member Ban History - Admin Panel",
                                },
                            },
                            {
                                path: "/admin/member/user/:id/addban",
                                component: UserBanAdd,
                                name: "UserBanAdd",
                                meta: {
                                    title: "Add Member Ban - Admin Panel",
                                },
                            },
                            {
                                path: "/admin/member/user/:id/donor",
                                component: UserDonor,
                                name: "UserDonor",
                                meta: {
                                    title: "Add Member Donor - Admin Panel",
                                },
                            },
                        ],
                    },
                ],
            },
        ],
    },
    {
        path: "/mall/upload",
        component: MallUploadPage,
        name: "mall-upload",
        meta: {
            title: "Mall Upload",
            wrapper: true,
        },
    },
    {
        path: "/mall/approval",
        component: MallApprovalPage,
        name: "mall-approval",
        meta: {
            title: "Mall Upload Approval",
            wrapper: true,
        },
    },
    {
        path: "/mall/shop",
        component: MallShopPage,
        name: "mall-shop",
        meta: {
            title: "Objects for Sale",
            wrapper: true,
        },
    },
    {
        path: "/object/:object_id",
        components: {
            default: ObjectProperties,
        },
        name: "object-properties",
        meta: {wrapper: false},
    },
];
