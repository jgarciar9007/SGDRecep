import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
    user: 'cndes',
    host: '192.168.20.3',
    database: 'cndes_db', // Using cndes_db as determined by migration
    password: 'PGCndes2026*',
    port: 5432,
});

pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

export default pool;
