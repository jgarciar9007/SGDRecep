import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = join(__dirname, 'cndes.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error(err.message);
    else console.log('Connected to DB for seeding.');
});

const records = [
    {
        id: '2026-001', registrationDate: '2026-01-15', type: 'Entrada', docNumber: 'MIN-HAC-2026/054', docDate: '2026-01-14',
        origin: 'Ministerio de Hacienda y Presupuestos', destination: 'Secretaría General',
        summary: 'Remisión de anteproyecto de presupuesto 2026 para revisión.',
        observations: 'Urgente. Reunión programada para el 30/01.', status: 'Pendiente'
    },
    {
        id: '2026-002', registrationDate: '2026-01-18', type: 'Entrada', docNumber: 'OF-PRES-009', docDate: '2026-01-17',
        origin: 'Presidencia de la República', destination: 'Presidente CNDES',
        summary: 'Invitación oficial al acto de apertura del año judicial.',
        observations: '', status: 'Completado'
    },
    {
        id: '2026-003', registrationDate: '2026-01-19', type: 'Interno', docNumber: 'INT-2026-001', docDate: '2026-01-19',
        origin: 'Vicepresidente 1 Bloque Social', destination: 'Comisión Técnica Sector Social',
        summary: 'Instrucciones para la elaboración del informe trimestral.',
        observations: 'Plazo de entrega: 5 días.', status: 'En Proceso'
    },
    {
        id: '2026-004', registrationDate: '2026-01-20', type: 'Salida', docNumber: 'SAL-2026-001', docDate: '2026-01-20',
        origin: 'Secretaría General', destination: 'GEPetrol',
        summary: 'Solicitud de informe sobre impacto ambiental en nuevos pozos.',
        observations: '', status: 'Enviado'
    },
    {
        id: '2026-005', registrationDate: '2026-01-21', type: 'Entrada', docNumber: 'GEP-SERV-88', docDate: '2026-01-20',
        origin: 'GEPetrol Servicios', destination: 'Comisión Técnica Sector Económico',
        summary: 'Respuesta a la solicitud de auditoría externa.',
        observations: 'Adjunta anexos confidenciales.', status: 'Pendiente'
    },
    {
        id: '2026-006', registrationDate: '2026-01-22', type: 'Interno', docNumber: 'INT-2026-002', docDate: '2026-01-22',
        origin: 'Gabinete del Presidente', destination: 'Todos los Departamentos',
        summary: 'Circular sobre nuevo horario laboral durante festividades.',
        observations: '', status: 'Completado'
    },
    {
        id: '2026-007', registrationDate: '2026-01-22', type: 'Entrada', docNumber: 'EDU-BEC-2026', docDate: '2026-01-21',
        origin: 'Ministerio de Educación', destination: 'Comisión Técnica Sector Social',
        summary: 'Listado de becas asignadas para validación.',
        observations: 'Revisar criterios de selección.', status: 'En Proceso'
    },
    {
        id: '2026-008', registrationDate: '2026-01-23', type: 'Salida', docNumber: 'SAL-2026-002', docDate: '2026-01-23',
        origin: 'Secretaría General', destination: 'Ministerio de Interior',
        summary: 'Confirmación de asistencia a la conferencia de seguridad.',
        observations: '', status: 'Enviado'
    },
    {
        id: '2026-009', registrationDate: '2026-01-23', type: 'Entrada', docNumber: 'NOT-EXT-991', docDate: '2026-01-22',
        origin: 'Ministerio de Asuntos Exteriores', destination: 'Presidente',
        summary: 'Nota verbal sobre visita de delegación de la UA.',
        observations: 'Alta prioridad.', status: 'Pendiente'
    },
    {
        id: '2026-010', registrationDate: '2026-01-23', type: 'Interno', docNumber: 'INT-2026-003', docDate: '2026-01-23',
        origin: 'Comisión Técnica Sector Económico', destination: 'Pleno',
        summary: 'Propuesta de dictamen sobre la Ley de Inversiones.',
        observations: 'Para presentar en la próxima sesión.', status: 'Borrador'
    }
];

const insertSql = `INSERT OR REPLACE INTO documents (
    id, registrationDate, type, docNumber, docDate, 
    origin, destination, summary, observations, status, attachments, createdAt
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '[]', ?)`;

db.serialize(() => {
    const stmt = db.prepare(insertSql);
    records.forEach(r => {
        stmt.run(
            r.id, r.registrationDate, r.type, r.docNumber, r.docDate,
            r.origin, r.destination, r.summary, r.observations, r.status, new Date().toISOString()
        );
    });
    stmt.finalize();
    console.log(`Seeded ${records.length} records.`);
});

db.close();
