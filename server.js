const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Serveer statische bestanden vanuit de "public" map
app.use(express.static(path.join(__dirname, 'public')));

// Een eenvoudige route voor de homepage
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start de server
app.listen(PORT, () => {
    console.log(`Server draait op http://localhost:${PORT}`);
});