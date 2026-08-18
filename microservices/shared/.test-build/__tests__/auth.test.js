"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Tests for the authorisation rules.
 *
 * These are the checks that replaced "no server-side authorisation at all", so
 * they are worth pinning down: every one of them corresponds to something that
 * used to be possible.
 */
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const auth_1 = require("../auth");
const errors_1 = require("../errors");
function user(role, id) {
    return {
        kind: 'user',
        uid: `uid-${role}-${id}`,
        role,
        id,
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
    };
}
const service = {
    kind: 'service',
    uid: 'internal',
    role: null,
    id: null,
    firstName: null,
    lastName: null,
    email: null,
    serviceName: 'estimate-service',
};
function expectForbidden(run) {
    try {
        run();
    }
    catch (error) {
        strict_1.default.ok(error instanceof errors_1.AppError);
        strict_1.default.equal(error.status, 403);
        return;
    }
    strict_1.default.fail('expected a 403');
}
(0, node_test_1.describe)('isStaff / isAdmin', () => {
    (0, node_test_1.it)('treats inspectors as staff but not as admins', () => {
        strict_1.default.equal((0, auth_1.isStaff)(user('inspector', 1)), true);
        strict_1.default.equal((0, auth_1.isAdmin)(user('inspector', 1)), false);
    });
    (0, node_test_1.it)('treats a customer as neither', () => {
        strict_1.default.equal((0, auth_1.isStaff)(user('client', 1)), false);
        strict_1.default.equal((0, auth_1.isAdmin)(user('client', 1)), false);
    });
    (0, node_test_1.it)('treats super admins as admins', () => {
        strict_1.default.equal((0, auth_1.isAdmin)(user('super_admin', 1)), true);
    });
    (0, node_test_1.it)('treats an internal service call as both', () => {
        strict_1.default.equal((0, auth_1.isStaff)(service), true);
        strict_1.default.equal((0, auth_1.isAdmin)(service), true);
    });
    (0, node_test_1.it)('treats an account with no profile row as neither', () => {
        strict_1.default.equal((0, auth_1.isStaff)(user(null, null)), false);
    });
});
(0, node_test_1.describe)('assertClientAccess', () => {
    (0, node_test_1.it)('lets a customer read their own records', () => {
        strict_1.default.doesNotThrow(() => (0, auth_1.assertClientAccess)(user('client', 7), 7));
    });
    (0, node_test_1.it)("refuses a customer reading somebody else's records", () => {
        // GET /api/estimates/client/8 with client 7's token: the IDOR that
        // existed on every /client/:clientId route.
        expectForbidden(() => (0, auth_1.assertClientAccess)(user('client', 7), 8));
    });
    (0, node_test_1.it)('lets staff read any customer', () => {
        strict_1.default.doesNotThrow(() => (0, auth_1.assertClientAccess)(user('admin', 1), 8));
        strict_1.default.doesNotThrow(() => (0, auth_1.assertClientAccess)(user('inspector', 2), 8));
    });
});
(0, node_test_1.describe)('assertInspectorAccess', () => {
    (0, node_test_1.it)('lets an inspector read their own queue', () => {
        strict_1.default.doesNotThrow(() => (0, auth_1.assertInspectorAccess)(user('inspector', 3), 3));
    });
    (0, node_test_1.it)("refuses an inspector reading another inspector's queue", () => {
        expectForbidden(() => (0, auth_1.assertInspectorAccess)(user('inspector', 3), 4));
    });
    (0, node_test_1.it)('lets an admin read anyone', () => {
        strict_1.default.doesNotThrow(() => (0, auth_1.assertInspectorAccess)(user('admin', 1), 4));
    });
    (0, node_test_1.it)('refuses a customer entirely', () => {
        expectForbidden(() => (0, auth_1.assertInspectorAccess)(user('client', 3), 3));
    });
});
(0, node_test_1.describe)('assertNotificationRecipient', () => {
    (0, node_test_1.it)('lets a recipient read their own notifications', () => {
        strict_1.default.doesNotThrow(() => (0, auth_1.assertNotificationRecipient)(user('admin', 2), 'admin', 2));
    });
    (0, node_test_1.it)("refuses reading another person's notifications, even for an admin", () => {
        // Notifications are private to the recipient. Being an admin does not
        // make somebody else's alerts yours to read.
        expectForbidden(() => (0, auth_1.assertNotificationRecipient)(user('admin', 2), 'client', 5));
        expectForbidden(() => (0, auth_1.assertNotificationRecipient)(user('admin', 2), 'admin', 3));
    });
    (0, node_test_1.it)('allows an internal service call, which is how alerts get created', () => {
        strict_1.default.doesNotThrow(() => (0, auth_1.assertNotificationRecipient)(service, 'client', 5));
    });
});
