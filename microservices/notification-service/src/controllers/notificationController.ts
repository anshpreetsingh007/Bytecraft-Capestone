import type { Request, Response } from 'express';
import * as notificationService from '../services/notificationService';
import {
    NOTIFICATION_TYPES,
    RECIPIENT_TYPES,
    type NotificationType,
    type RecipientType,
} from '../models/model';
import {
    assertNotificationRecipient,
    badRequest,
    getActor,
    idParam,
    notFound,
    optionalInt,
    optionalString,
    pagination,
    requireBoolean,
    requireEnum,
    requireInt,
    requireString,
    sanitizeText,
    toPage,
    type Actor,
} from '../shared';

/**
 * Works out whose notifications the caller is asking about.
 *
 * The frontend passes recipientType/recipientId explicitly, so those are still
 * accepted -- but they are checked against the signed-in user rather than
 * trusted. Previously `GET /api/notifications?recipientType=client&recipientId=7`
 * returned client #7's notifications to anybody who asked.
 */
function resolveRecipient(
    actor: Actor,
    rawType: unknown,
    rawId: unknown,
): { recipientType: RecipientType; recipientId: number } {
    const recipientType =
        rawType === undefined || rawType === ''
            ? (actor.role as RecipientType | null)
            : requireEnum(rawType, 'recipientType', RECIPIENT_TYPES);

    const recipientId =
        rawId === undefined || rawId === ''
            ? actor.id
            : requireInt(rawId, 'recipientId', { min: 1 });

    if (!recipientType || recipientId === null) {
        throw badRequest('recipientType and recipientId are required');
    }

    assertNotificationRecipient(actor, recipientType, recipientId);
    return { recipientType, recipientId };
}

export async function getAll(req: Request, res: Response): Promise<void> {
    const actor = getActor(req);
    const { recipientType, recipientId } = resolveRecipient(
        actor,
        req.query.recipientType,
        req.query.recipientId,
    );

    const unreadOnly = req.query.unreadOnly === undefined ? false : requireBoolean(req.query.unreadOnly, 'unreadOnly');
    const page = pagination(req, 20);

    const { rows, total } = await notificationService.listNotifications(
        recipientType,
        recipientId,
        unreadOnly,
        page,
    );

    res.json(toPage(rows, total, page));
}

export async function getUnreadCount(req: Request, res: Response): Promise<void> {
    const actor = getActor(req);
    const { recipientType, recipientId } = resolveRecipient(
        actor,
        req.query.recipientType,
        req.query.recipientId,
    );

    const count = await notificationService.getUnreadCount(recipientType, recipientId);
    res.json({ count });
}

/** Internal only -- raised by other services, never by a browser. */
export async function create(req: Request, res: Response): Promise<void> {
    const notification = await notificationService.createNotification({
        recipient_type: requireEnum(req.body.recipient_type, 'recipient_type', RECIPIENT_TYPES),
        recipient_id: requireInt(req.body.recipient_id, 'recipient_id', { min: 1 }),
        type: requireEnum<NotificationType>(req.body.type, 'type', NOTIFICATION_TYPES),
        title: sanitizeText(requireString(req.body.title, 'title', { max: 150 })),
        message: optionalString(req.body.message, 'message', { max: 2000 }),
        related_entity_type: optionalString(req.body.related_entity_type, 'related_entity_type', { max: 30 }),
        related_entity_id: optionalInt(req.body.related_entity_id, 'related_entity_id', { min: 1 }),
    });

    res.status(201).json(notification);
}

/** Internal only. */
export async function broadcastAdmins(req: Request, res: Response): Promise<void> {
    const notifications = await notificationService.broadcastToAdmins({
        type: requireEnum<NotificationType>(req.body.type, 'type', NOTIFICATION_TYPES),
        title: sanitizeText(requireString(req.body.title, 'title', { max: 150 })),
        message: optionalString(req.body.message, 'message', { max: 2000 }),
        related_entity_type: optionalString(req.body.related_entity_type, 'related_entity_type', { max: 30 }),
        related_entity_id: optionalInt(req.body.related_entity_id, 'related_entity_id', { min: 1 }),
    });

    res.status(201).json({ created: notifications.length, notifications });
}

export async function markAsRead(req: Request, res: Response): Promise<void> {
    const actor = getActor(req);
    const { recipientType, recipientId } = resolveRecipient(actor, undefined, undefined);

    const updated = await notificationService.markAsRead(idParam(req), recipientType, recipientId);
    if (!updated) throw notFound('Notification not found');

    res.json(updated);
}

export async function markAllAsRead(req: Request, res: Response): Promise<void> {
    const actor = getActor(req);
    const { recipientType, recipientId } = resolveRecipient(
        actor,
        req.body?.recipientType,
        req.body?.recipientId,
    );

    const updatedCount = await notificationService.markAllAsRead(recipientType, recipientId);
    res.json({ updatedCount });
}

export async function remove(req: Request, res: Response): Promise<void> {
    const actor = getActor(req);
    const { recipientType, recipientId } = resolveRecipient(actor, undefined, undefined);

    const deleted = await notificationService.deleteNotification(idParam(req), recipientType, recipientId);
    if (!deleted) throw notFound('Notification not found');

    res.status(204).send();
}
