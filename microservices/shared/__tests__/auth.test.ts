/**
 * Tests for the authorisation rules.
 *
 * These are the checks that replaced "no server-side authorisation at all", so
 * they are worth pinning down: every one of them corresponds to something that
 * used to be possible.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
    assertClientAccess,
    assertInspectorAccess,
    assertNotificationRecipient,
    isAdmin,
    isStaff,
    type Actor,
    type Role,
} from '../auth';
import { AppError } from '../errors';

function user(role: Role | null, id: number | null): Actor {
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

const service: Actor = {
    kind: 'service',
    uid: 'internal',
    role: null,
    id: null,
    firstName: null,
    lastName: null,
    email: null,
    serviceName: 'estimate-service',
};

function expectForbidden(run: () => unknown): void {
    try {
        run();
    } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.status, 403);
        return;
    }
    assert.fail('expected a 403');
}

describe('isStaff / isAdmin', () => {
    it('treats inspectors as staff but not as admins', () => {
        assert.equal(isStaff(user('inspector', 1)), true);
        assert.equal(isAdmin(user('inspector', 1)), false);
    });

    it('treats a customer as neither', () => {
        assert.equal(isStaff(user('client', 1)), false);
        assert.equal(isAdmin(user('client', 1)), false);
    });

    it('treats super admins as admins', () => {
        assert.equal(isAdmin(user('super_admin', 1)), true);
    });

    it('treats an internal service call as both', () => {
        assert.equal(isStaff(service), true);
        assert.equal(isAdmin(service), true);
    });

    it('treats an account with no profile row as neither', () => {
        assert.equal(isStaff(user(null, null)), false);
    });
});

describe('assertClientAccess', () => {
    it('lets a customer read their own records', () => {
        assert.doesNotThrow(() => assertClientAccess(user('client', 7), 7));
    });

    it("refuses a customer reading somebody else's records", () => {
        // GET /api/estimates/client/8 with client 7's token: the IDOR that
        // existed on every /client/:clientId route.
        expectForbidden(() => assertClientAccess(user('client', 7), 8));
    });

    it('lets staff read any customer', () => {
        assert.doesNotThrow(() => assertClientAccess(user('admin', 1), 8));
        assert.doesNotThrow(() => assertClientAccess(user('inspector', 2), 8));
    });
});

describe('assertInspectorAccess', () => {
    it('lets an inspector read their own queue', () => {
        assert.doesNotThrow(() => assertInspectorAccess(user('inspector', 3), 3));
    });

    it("refuses an inspector reading another inspector's queue", () => {
        expectForbidden(() => assertInspectorAccess(user('inspector', 3), 4));
    });

    it('lets an admin read anyone', () => {
        assert.doesNotThrow(() => assertInspectorAccess(user('admin', 1), 4));
    });

    it('refuses a customer entirely', () => {
        expectForbidden(() => assertInspectorAccess(user('client', 3), 3));
    });
});

describe('assertNotificationRecipient', () => {
    it('lets a recipient read their own notifications', () => {
        assert.doesNotThrow(() => assertNotificationRecipient(user('admin', 2), 'admin', 2));
    });

    it("refuses reading another person's notifications, even for an admin", () => {
        // Notifications are private to the recipient. Being an admin does not
        // make somebody else's alerts yours to read.
        expectForbidden(() => assertNotificationRecipient(user('admin', 2), 'client', 5));
        expectForbidden(() => assertNotificationRecipient(user('admin', 2), 'admin', 3));
    });

    it('allows an internal service call, which is how alerts get created', () => {
        assert.doesNotThrow(() => assertNotificationRecipient(service, 'client', 5));
    });
});
