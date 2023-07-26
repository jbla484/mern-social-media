const express = require('express');
const router = express.Router();

router.get('/', (req, res) => res.send('posts route'));
router.post('/', (req, res) => res.send('posts post route'));

module.exports = router;
