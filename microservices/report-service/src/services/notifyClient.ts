import { callServiceBestEffort } from '../shared';

const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3005';

export async function notifyJobReportSubmitted(reportId: number, orderId: number): Promise<void> {
    await callServiceBestEffort(`${NOTIFICATION_SERVICE_URL}/api/notifications/broadcast-admins`, {
        callerName: 'report-service',
        body: {
            type: 'job_report_submitted',
            title: 'A job report is ready for review',
            message: `Report #${reportId} for order #${orderId} has been submitted by the inspector.`,
            related_entity_type: 'report',
            related_entity_id: reportId,
        },
    });
}
