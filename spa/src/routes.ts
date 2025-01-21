import HomePage from "./pages/HomePage.vue";
import AboutPage from "./pages/AboutPage.vue";
import RulesRegulationsPage from "./pages/RulesandRegulationPage.vue";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage.vue";
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

import UpdateStorageArea from "@/components/storage/Update.vue";
import StorageUnit from "@/components/storage/Unit.vue";

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
import UserCurrentRoles from "@/pages/admin/user/CurrentRoles.vue";
import UserHireRoles from "@/pages/admin/user/HireRoles.vue";
import UserFireRoles from "@/pages/admin/user/FireRoles.vue";
import UserDonor from "@/pages/admin/user/donor.vue";
import AvatarSearch from "@/pages/admin/avatar/search.vue";
import PlaceSearch from "@/pages/admin/place/search.vue";
import ObjectSearch from "@/pages/admin/objects/search.vue";
import AdminObjectUpdate from "@/pages/admin/objects/update.vue";

import MallRulesPage from "@/pages/mall/MallRulesPage.vue";
import MallUploadPage from "@/pages/mall/MallUploadPage.vue";
import CreatorPage from "@/pages/mall/creator/CreatorPage.vue";
import CreatorPending from "@/pages/mall/creator/pending.vue";
import CreatorStocked from "@/pages/mall/creator/stocked.vue";
import CreatorRestock from "@/pages/mall/creator/restock.vue";
import CreatorCatalog from "@/pages/mall/creator/catalog.vue";
import MallStaffPage from "@/pages/mall/staff/StaffPage.vue";
import MallWarehouse from "@/pages/mall/staff/warehouse.vue";
import MallPending from "@/pages/mall/staff/pending.vue";
import MallStocked from "@/pages/mall/staff/stocked.vue";
import MallSoldOut from "@/pages/mall/staff/soldout.vue";
import MallObjectSearch from "@/pages/mall/staff/search.vue";
import MallChecker from "@/pages/mall/checker.vue";

import ObjectProperties from "./pages/ObjectProperties.vue";

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
        path: "/rulesandregulations",
        component: RulesRegulationsPage,
        name: "rulesandregulations",
        meta: {
            title: "Rules and Regulations",
        },
    },
    {
        path: "/privacypolicy",
        component: PrivacyPolicyPage,
        name: "privacypolicy",
        meta: {
            title: "Privacy Policy",
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
        path: "/information/:type/:id/:slug?",
        component: InformationPage,
        name: "information",
        meta: {
            title: "Information",
            wrapper: false,
        },
    },
    {
        path: "/admin/update-object/:id",
        component: AdminObjectUpdate,
        name: "AdminObjectUpdate",
        meta: {
            title: "Update Object - Admin Panel",
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
                                path: "/admin/member/user/:id/roles/hire",
                                component: UserHireRoles,
                                name: "UserHireRoles",
                                meta: {
                                    title: "Member Hire Roles - Admin Panel",
                                },
                            },
                            {
                                path: "/admin/member/user/:id/roles",
                                component: UserCurrentRoles,
                                name: "UserCurrentRoles",
                                meta: {
                                    title: "Member Current Roles - Admin Panel",
                                },
                            },
                            {
                                path: "/admin/member/user/:id/roles/fire",
                                component: UserFireRoles,
                                name: "UserFireRoles",
                                meta: {
                                    title: "Member Fire Roles - Admin Panel",
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
            {
                path: "/admin/avatar/",
                component: AvatarSearch,
                name: "AvatarSearch",
                meta: {
                    title: "Avatar Search - Admin Panel",
                },
            },
            {
                path: "/admin/place/",
                component: PlaceSearch,
                name: "PlaceSearch",
                meta: {
                    title: "Places Search - Admin Panel",
                },
            },
            {
                path: "/admin/objects/",
                component: ObjectSearch,
                name: "ObjectSearch",
                meta: {
                    title: "Object Search - Admin Panel",
                },
            },
        ],
    },
    {
        path: "/mall/rules",
        component: MallRulesPage,
        name: "mall-rules",
        meta: {
            title: "Mall Rules",
            wrapper: true,
        },
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
        path: "/mall/checker/:object_id",
        component: MallChecker,
        name: "mall-checker",
        meta: {
            title: "Mall Checker",
            wrapper: false,
        },
    },
    {
        path: "/mall/staff",
        component: MallStaffPage,
        name: "mall-staff",
        meta: {
            title: "Mall Staff Panel",
            wrapper: false,
        },
        children: [
            {
                path: "/mall/warehouse",
                component: MallWarehouse,
                name: "MallWarehouse",
                meta: {
                    title: "Mall Object Warehouse - Mall Staff Panel",
                },
            },
            {
                path: "/mall/pending",
                component: MallPending,
                name: "MallPending",
                meta: {
                    title: "Mall Object Pending - Mall Staff Panel",
                },
            },
            {
                path: "/mall/stocked",
                component: MallStocked,
                name: "MallStocked",
                meta: {
                    title: "Mall Object Stocked - Mall Staff Panel",
                },
            },
            {
                path: "/mall/soldout",
                component: MallSoldOut,
                name: "MallSoldOut",
                meta: {
                    title: "Mall Object Sold Out - Mall Staff Panel",
                },
            },
            {
                path: "/mall/search",
                component: MallObjectSearch,
                name: "MallObjectSearch",
                meta: {
                    title: "Mall Object Search - Mall Staff Panel",
                },
            },
        ]
    },
    {
        path: "/creator",
        component: CreatorPage,
        name: "creator-page",
        meta: {
            title: "Object Creator Panel",
            wrapper: false,
        },
        children: [
            {
                path: "/creator/pending",
                component: CreatorPending,
                name: "CreatorPending",
                meta: {
                    title: "Creators Pending Objects - Object Creator Panel",
                },
            },
            {
                path: "/creator/stocked",
                component: CreatorStocked,
                name: "CreatorStocked",
                meta: {
                    title: "Creators Stocked Objects - Object Creator Panel",
                },
            },
            {
                path: "/creator/restock",
                component: CreatorRestock,
                name: "CreatorRestock",
                meta: {
                    title: "Creators Restockable Objects - Object Creator Panel",
                },
            },
            {
                path: "/creator/catalog",
                component: CreatorCatalog,
                name: "CreatorCatalog",
                meta: {
                    title: "Creators Catalog - Object Creator Panel",
                },
            },
        ]
    },
    {
        path: "/mall/object/:object_id",
        components: {
            default: ObjectProperties,
        },
        name: "mall-object-properties",
        meta: {wrapper: false},
    },
    {
        path: "/object/:object_id",
        components: {
            default: ObjectProperties,
        },
        name: "object-properties",
        meta: { wrapper: false },
    },
    {
        path: "/storage/update",
        components: {
            default: UpdateStorageArea,
        },
        name: "update-storage",
        meta: { wrapper: false },
    },
    {
        path: "/storage/unit/:id",
        components: {
            default: StorageUnit,
        },
        name: "storage-unit",
        meta: { wrapper: false },
    },
];
