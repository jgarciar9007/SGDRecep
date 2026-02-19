import { Client } from 'ssh2';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config = {
    host: '192.168.20.6',
    port: 22,
    username: 'root',
    password: 'Cndes2026*',
};

const conn = new Client();

async function findAppDirectory(sftp) {
    console.log('Searching for application directory...');
    return new Promise((resolve, reject) => {
        conn.exec('ps aux | grep "node index.js" | grep -v grep', (err, stream) => {
            if (err) return reject(err);
            let output = '';
            stream.on('data', (data) => {
                output += data.toString();
            }).on('close', () => {
                if (output.trim()) {
                    // Extract path from process (e.g., node /path/to/server/index.js)
                    const match = output.match(/node\s+(.+?)index\.js/);
                    if (match && match[1]) {
                        const serverPath = match[1].trim(); // /path/to/server/
                        const appPath = path.dirname(serverPath.replace(/\/$/, '')); // /path/to
                        console.log(`Found running app at: ${appPath}`);
                        resolve(appPath);
                        return;
                    }
                }

                // Fallback: Try common paths
                const commonPaths = ['/var/www/SGDRecep', '/home/cndes/SGDRecep', '/opt/SGDRecep'];
                checkPaths(sftp, commonPaths, resolve, reject);
            });
        });
    });
}

function checkPaths(sftp, paths, resolve, reject) {
    if (paths.length === 0) {
        return reject(new Error('Could not verify application directory.'));
    }
    const currentPath = paths.shift();
    sftp.stat(currentPath, (err, stats) => {
        if (!err && stats.isDirectory()) {
            console.log(`Found directory at: ${currentPath}`);
            resolve(currentPath);
        } else {
            checkPaths(sftp, paths, resolve, reject);
        }
    });
}

async function uploadDirectory(sftp, localDir, remoteDir) {
    const files = fs.readdirSync(localDir);

    // Ensure remote dir exists
    await new Promise((resolve, reject) => {
        sftp.mkdir(remoteDir, { mode: '0755' }, (err) => {
            if (err && err.code !== 4) { // Ignore failure if it already exists (code 4 usually)
                // Continue anyway, maybe it exists
            }
            resolve();
        });
    });

    for (const file of files) {
        const localPath = path.join(localDir, file);
        const remotePath = `${remoteDir}/${file}`; // SSH uses forward slashes
        const stats = fs.statSync(localPath);

        if (stats.isDirectory()) {
            if (file !== 'node_modules' && file !== '.git') {
                await uploadDirectory(sftp, localPath, remotePath);
            }
        } else {
            console.log(`Uploading ${file}...`);
            await new Promise((resolve, reject) => {
                sftp.fastPut(localPath, remotePath, (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        }
    }
}

conn.on('ready', () => {
    console.log('Client :: ready');
    conn.sftp(async (err, sftp) => {
        if (err) throw err;

        try {
            const appPath = await findAppDirectory(sftp);

            console.log('Uploading server files...');
            await uploadDirectory(sftp, path.join(__dirname, 'server'), `${appPath}/server`);

            console.log('Uploading dist files...');
            // Assuming dist maps to client build serveing
            // Ensure dist exists on server
            const distPath = `${appPath}/dist`;
            try {
                await new Promise((res, rej) => sftp.mkdir(distPath, (e) => res()));
            } catch (e) { }

            await uploadDirectory(sftp, path.join(__dirname, 'dist'), distPath);

            console.log('Restarting application...');
            conn.exec('pm2 restart all || systemctl restart sgdrecep', (err, stream) => {
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

        } catch (e) {
            console.error(e);
            conn.end();
        }
    });
}).on('error', (err) => {
    console.error('Connection Error:', err);
}).connect(config);
