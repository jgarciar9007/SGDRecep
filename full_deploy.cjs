const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('Client :: ready');
    // FULL DEPLOY: Reset hard to main, install, build, and restart PM2
    // We also make sure the DB is initialized by the server
    const command = 'cd /var/www/SGDRecep && git fetch origin && git reset --hard origin/main && npm install && cd server && npm install && cd .. && npm run build && pm2 restart sgdrecep --env production';
    conn.exec(command, (err, stream) => {
        if (err) throw err;
        stream.on('close', (code, signal) => {
            console.log('Deploy Finished with code: ' + code);
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
