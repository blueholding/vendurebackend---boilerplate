"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const core_1 = require("@vendure/core");
const email_plugin_1 = require("@vendure/email-plugin");
const asset_server_plugin_1 = require("@vendure/asset-server-plugin");
const admin_ui_plugin_1 = require("@vendure/admin-ui-plugin");
const stripe_1 = require("@vendure/payments-plugin/package/stripe");
require("dotenv/config");
const path_1 = __importDefault(require("path"));
const isDev = process.env.APP_ENV === 'dev';
const sgMail = require('@sendgrid/mail');
if ((_a = process.env.SENDGRID_API_KEY) === null || _a === void 0 ? void 0 : _a.startsWith('SG.')) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}
class SendgridEmailSender {
    async send(email) {
        await sgMail.send({
            to: email.recipient,
            from: email.from,
            subject: email.subject,
            html: email.body,
        });
    }
}
const emailPluginOptions = isDev || !process.env.SENDGRID_API_KEY
    ? {
        devMode: true,
        outputPath: path_1.default.join(__dirname, '../static/email/test-emails'),
        route: 'mailbox',
    }
    : {
        emailSender: new SendgridEmailSender(),
        transport: {
            type: 'sendgrid',
            apiKey: process.env.SENDGRID_API_KEY,
        },
    };
exports.config = {
    apiOptions: {
        port: +(process.env.PORT || 3000),
        adminApiPath: 'admin-api',
        shopApiPath: 'shop-api',
        ...(isDev
            ? {
                adminApiPlayground: {
                    settings: { 'request.credentials': 'include' },
                },
                adminApiDebug: true,
                shopApiPlayground: {
                    settings: { 'request.credentials': 'include' },
                },
                shopApiDebug: true,
            }
            : {}),
    },
    authOptions: {
        tokenMethod: ['bearer', 'cookie'],
        superadminCredentials: {
            identifier: process.env.SUPERADMIN_USERNAME,
            password: process.env.SUPERADMIN_PASSWORD,
        },
        cookieOptions: {
            secret: process.env.COOKIE_SECRET,
        },
    },
    dbConnectionOptions: {
        type: 'postgres',
        synchronize: true,
        migrations: [path_1.default.join(__dirname, './migrations/*.+(js|ts)')],
        logging: false,
        database: process.env.DB_NAME,
        schema: process.env.DB_SCHEMA,
        host: process.env.DB_HOST,
        port: +process.env.DB_PORT,
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        ssl: true,
        extra: {
            ssl: {
                rejectUnauthorized: false,
            },
        },
    },
    paymentOptions: {
        paymentMethodHandlers: [core_1.dummyPaymentHandler],
    },
    customFields: {},
    plugins: [
        asset_server_plugin_1.AssetServerPlugin.init({
            route: 'assets',
            assetUploadDir: process.env.ASSET_VOLUME_PATH ||
                path_1.default.join(__dirname, '../static/assets'),
            assetUrlPrefix: isDev
                ? undefined
                : `https://${process.env.PUBLIC_DOMAIN}/assets/`,
        }),
        stripe_1.StripePlugin.init({
            storeCustomersInStripe: true,
            paymentIntentCreateParams: (injector, ctx, order) => {
                var _a;
                return {
                    description: `Order #${order.code} for ${(_a = order.customer) === null || _a === void 0 ? void 0 : _a.emailAddress}`,
                };
            },
        }),
        core_1.DefaultSchedulerPlugin.init(),
        core_1.DefaultJobQueuePlugin.init({
            useDatabaseForBuffer: true,
        }),
        core_1.DefaultSearchPlugin.init({
            bufferUpdates: false,
            indexStockStatus: true,
        }),
        email_plugin_1.EmailPlugin.init({
            ...emailPluginOptions,
            handlers: email_plugin_1.defaultEmailHandlers,
            templatePath: path_1.default.join(__dirname, '../static/email/templates'),
            globalTemplateVars: {
                fromAddress: process.env.EMAIL_FROM_ADDRESS ||
                    '"example" <noreply@example.com>',
                verifyEmailAddressUrl: `${process.env.STOREFRONT_URL}/verify`,
                passwordResetUrl: `${process.env.STOREFRONT_URL}/password-reset`,
                changeEmailAddressUrl: `${process.env.STOREFRONT_URL}/verify-email-address-change`,
            },
        }),
        admin_ui_plugin_1.AdminUiPlugin.init({
            route: 'admin',
            port: 3002,
            adminUiConfig: {
                apiHost: 'auto',
                apiPort: 'auto',
            },
        }),
    ],
};
