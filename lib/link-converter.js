const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');

const configFile = path.join(__dirname, '../config/default-config.json');

// Initialize config file if it doesn't exist
async function initConfig() {
  try {
    await fs.access(configFile);
  } catch (error) {
    const defaultConfig = { links: [] };
    await fs.writeFile(configFile, JSON.stringify(defaultConfig, null, 2));
  }
}

// Get all links
async function getAllLinks() {
  await initConfig();
  const data = await fs.readFile(configFile, 'utf8');
  const config = JSON.parse(data);
  return config.links;
}

// Add a new link
async function addLink(name, url) {
  await initConfig();
  const data = await fs.readFile(configFile, 'utf8');
  const config = JSON.parse(data);
  
  const newLink = {
    id: uuidv4(),
    name,
    url,
    createdAt: new Date().toISOString()
  };
  
  config.links.push(newLink);
  await fs.writeFile(configFile, JSON.stringify(config, null, 2));
  
  return newLink;
}

// Get link by ID
async function getLinkById(id) {
  await initConfig();
  const data = await fs.readFile(configFile, 'utf8');
  const config = JSON.parse(data);
  return config.links.find(link => link.id === id);
}

// Generate QR code
async function generateQRCode(text) {
  try {
    const qrCodeBuffer = await QRCode.toBuffer(text);
    return qrCodeBuffer;
  } catch (error) {
    throw new Error('Failed to generate QR code');
  }
}

module.exports = {
  getAllLinks,
  addLink,
  getLinkById,
  generateQRCode
};