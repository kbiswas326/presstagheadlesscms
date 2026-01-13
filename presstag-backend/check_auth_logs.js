const fs = require('fs');
const path = require('path');

const logPath = path.join(__dirname, 'auth_errors.log');

try {
    if (fs.existsSync(logPath)) {
        console.log('--- AUTH ERRORS LOG ---');
        console.log(fs.readFileSync(logPath, 'utf8'));
        console.log('-----------------------');
    } else {
        console.log('No auth errors logged yet.');
    }
} catch (e) {
    console.error('Error reading log:', e);
}
