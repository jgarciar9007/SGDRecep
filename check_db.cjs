const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('Client :: ready');
    // Command to list users from the database
    const command = 'sqlite3 /var/www/SGDRecep/server/cndes.db "SELECT username, password FROM users;"';
    conn.exec(command, (err, stream) => {
        if (err) throw err;
        stream.on('close', (code, signal) => {
            console.log('Stream :: close :: code: ' + code + ', signal: ' + signal);
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
