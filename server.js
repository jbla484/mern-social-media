const express = require('express');
const connectDatabase = require('./config/database');
const app = express();
const PORT = process.env.PORT || 3001;

initialize();

app.get('/', (req, res) => {
    res.send('API running...');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

function initialize() {
    connectDatabase();

    app.use(express.json());
    app.use('/api/users', require('./routes/api/users'));
    app.use('/api/auth', require('./routes/api/auth'));
    app.use('/api/posts', require('./routes/api/posts'));
    app.use('/api/profile', require('./routes/api/profile'));
}
