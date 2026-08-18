/**
 * Identity for a service with no database.
 *
 * ai-chatbot-service has no Postgres connection, so it cannot resolve a
 * Firebase UID to a role the way the other services do. It verifies the token
 * itself -- that part needs nothing but node:crypto -- and then asks
 * auth-service who the user is, using the internal service token.
 */
import { callService, configureIdentityResolver, logger, type Actor, type Role } from './shared';

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3004';

interface ResolvedUser {
    role: Role;
    id: number;
    firstName: string;
    lastName: string;
    email: string;
}

export function installIdentityResolver(): void {
    configureIdentityResolver(async (uid, email) => {
        const anonymous: Actor = {
            kind: 'user',
            uid,
            role: null,
            id: null,
            firstName: null,
            lastName: null,
            email,
        };

        try {
            const user = await callService<ResolvedUser>(
                `${AUTH_SERVICE_URL}/api/auth/resolve/${encodeURIComponent(uid)}`,
                { method: 'GET', callerName: 'ai-chatbot-service', attempts: 2 },
            );

            if (!user) return anonymous;

            return {
                kind: 'user',
                uid,
                role: user.role,
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email ?? email,
            };
        } catch (error) {
            // A 404 means signed in but not registered yet, which is a normal
            // state. Anything else is worth knowing about, but either way the
            // chat should still answer questions -- it just cannot book.
            logger.warn('could not resolve chat user through auth-service', { err: error });
            return anonymous;
        }
    });
}
