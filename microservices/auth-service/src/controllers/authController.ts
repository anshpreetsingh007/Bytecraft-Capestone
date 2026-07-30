import { Request, Response } from 'express';
import * as authService from '../services/authService';

// ─── RESOLVE ──────────────────────────────────────────────────
// GET /api/auth/resolve/:firebaseUid
export async function resolve(req: Request, res: Response) {
    try {
        const { firebaseUid } = req.params;
        const user = await authService.resolveByFirebaseUid(firebaseUid);

        if (!user) {
            // Authenticated with Firebase, but no matching row in Postgres yet.
            // This is expected right after signup, before /register runs.
            res.status(404).json({ error: 'No matching user record found' });
            return;
        }

        res.json(user);
    } catch (error) {
        console.error('Error resolving user:', error);
        res.status(500).json({ error: 'Failed to resolve user' });
    }
}

// ─── REGISTER ─────────────────────────────────────────────────
// POST /api/auth/register — called right after Firebase signup succeeds
export async function register(req: Request, res: Response) {
    try {
        const { firebase_uid, first_name, last_name, email, phone, address } = req.body;

        if (!firebase_uid || !first_name || !last_name || !email) {
            res.status(400).json({ error: 'Missing required fields: firebase_uid, first_name, last_name, email' });
            return;
        }

        const user = await authService.registerClient({
            firebase_uid,
            first_name,
            last_name,
            email,
            phone,
            address,
        });

        res.status(201).json(user);
    } catch (error: any) {
        // Postgres unique_violation — this uid or email is already registered
        if (error?.code === '23505') {
            res.status(409).json({ error: 'A client with this email or account already exists' });
            return;
        }
        console.error('Error registering client:', error);
        res.status(500).json({ error: 'Failed to register client' });
    }
}
