const crypto = require('crypto');
const fs = require('fs');

function createHashForObject(obj) {
  const sortedObj = sortObjectKeys(obj);
  const jsonString = JSON.stringify(sortedObj);
  return crypto.createHash('sha256').update(jsonString).digest('hex');
}

function createHashForFile(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(fileBuffer).digest('hex');
}

function verifyHash(value, expectedHash) {
  const actualHash = createHashForObject(value);
  return actualHash === expectedHash;
}

function verifyFileHash(filePath, expectedHash) {
  const actualHash = createHashForFile(filePath);
  return actualHash === expectedHash;
}

function sortObjectKeys(obj) {
  if (typeof obj !== 'object' || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(sortObjectKeys);
  const sorted = {};
  Object.keys(obj).sort().forEach(key => {
    sorted[key] = sortObjectKeys(obj[key]);
  });
  return sorted;
}

module.exports = {
  createHashForObject,
  createHashForFile,
  verifyHash,
  verifyFileHash
};