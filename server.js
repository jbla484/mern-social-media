const express = require('express');
const connectDatabase = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3001;

connectDatabase();

app.use(express.json());

app.get('/', (req, res) => {
    res.send('API running...');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
