import { Request, Response } from 'express';
import * as authService from '../services/authService';

// resolve
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

// register
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

// getInspectors
// GET /api/auth/inspectors
export async function getInspectors(req: Request, res: Response) {
    try {
        const inspectors = await authService.getAllInspectors();
        res.json(inspectors);
    } catch (error) {
        console.error('Error fetching inspectors:', error);
        res.status(500).json({ error: 'Failed to fetch inspectors' });
    }
}

// getAllUsers
// GET /api/auth/users
export async function getAllUsers(req: Request, res: Response) {
    try {
        const users = await authService.getAllUsers();
        res.json(users);
    } catch (error) {
        console.error('Error fetching all users:', error);
        res.status(500).json({ error: 'Failed to fetch all users' });
    }
}

// assignRole
// PATCH /api/auth/users/role
export async function assignRole(req: Request, res: Response) {
    try {
        const { firebase_uid, role, first_name, last_name, email } = req.body;

        if (!firebase_uid || !role || !first_name || !last_name || !email) {
            res.status(400).json({ error: 'Missing required fields: firebase_uid, role, first_name, last_name, email' });
            return;
        }

        await authService.assignRole(firebase_uid, role, first_name, last_name, email);
        res.status(200).json({ success: true, message: `Successfully assigned role ${role}` });
    } catch (error: any) {
        console.error('Error assigning role:', error);
        res.status(500).json({ error: error.message || 'Failed to assign role' });
    }
}
