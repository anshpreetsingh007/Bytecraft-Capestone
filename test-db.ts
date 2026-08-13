
import { Client } from 'pg';
const client = new Client({ connectionString: 'postgres://postgres:postgres@localhost:5432/markit_roofing' });
client.connect().then(() => {
    return client.query(\INSERT INTO cost_estimate (
        order_id, inspector_id, admin_id, details, estimate_date, status,
        material_id, material_quantity, materials,
        length_ft, width_ft, pitch_ft
    )
    VALUES (\, \, \, \, \, \, \, \, \, \, \, \)\, [
        1, 1, null, 'details', new Date(), 'submitted', null, null, JSON.stringify([]), 40, 25, 6
    ]);
}).then(res => { console.log('success', res.rows); client.end(); }).catch(err => { console.error('DB Error:', err); client.end(); });

