const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('Client :: ready');
    // We'll run a small node script on the server to check the DB
    const remoteScript = `
        const sqlite3 = require('sqlite3').verbose();
        const db = new sqlite3.Database('/var/www/SGDRecep/server/cndes.db');
        db.all("SELECT username, password FROM users", (err, rows) => {
            if (err) {
                console.error(err);
                process.exit(1);
            }
            console.log(JSON.stringify(rows));
            db.close();
        });
    `;
    const command = \`node -e "\${remoteScript}"\`;
    conn.exec(command, (err, stream) => {
        if (err) throw err;
        stream.on('close', (code, signal) => {
            conn.end();
        }).on('data', (data) => {
            console.log('STDOUT: ' + data);
        }).stderr.on('data', (data) => {
            console.log('STDERR: ' + data);
        });
    });
}).connect({
    host: '192.168.20.70',
    port: 22,
    username: 'cndes',
    password: 'Cndes2025*'
});
