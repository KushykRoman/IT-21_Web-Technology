const fs = require('fs').promises;
const path = require('path');

const usersFilePath = path.join(__dirname, '../users.json');

async function readUsers() {
    try {
        const data = await fs.readFile(usersFilePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

async function writeUsers(users) {
    await fs.writeFile(usersFilePath, JSON.stringify(users, null, 2));
}

module.exports = { readUsers, writeUsers };