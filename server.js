const express = require('express');
const connectDatabase = require('./config/database');
const app = express();
const PORT = process.env.PORT || 3001;

initialize();

function initialize() {
    connectDatabase();

    app.use(express.json());
    app.use('/api/user', require('./routes/api/user'));
    app.use('/api/auth', require('./routes/api/auth'));
    app.use('/api/post', require('./routes/api/post'));
    app.use('/api/profile', require('./routes/api/profile'));

    app.get('/', (req, res) => {
        res.send('API running...');
    });

    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}
