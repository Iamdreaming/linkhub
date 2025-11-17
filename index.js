const express = require('express');
const path = require('path');
const linkConverter = require('./lib/link-converter');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Routes
app.get('/api/links', (req, res) => {
  const links = linkConverter.getAllLinks();
  res.json(links);
});

app.post('/api/links', (req, res) => {
  const { name, url } = req.body;
  const newLink = linkConverter.addLink(name, url);
  res.status(201).json(newLink);
});

app.get('/r/:id', (req, res) => {
  const { id } = req.params;
  const link = linkConverter.getLinkById(id);
  
  if (link) {
    res.redirect(link.url);
  } else {
    res.status(404).send('Link not found');
  }
});

app.get('/qr/:id', async (req, res) => {
  const { id } = req.params;
  const link = linkConverter.getLinkById(id);
  
  if (link) {
    const qrCode = await linkConverter.generateQRCode(`${req.protocol}://${req.get('host')}/r/${id}`);
    res.type('png').send(qrCode);
  } else {
    res.status(404).send('Link not found');
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});