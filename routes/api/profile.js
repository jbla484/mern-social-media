const express = require('express');
const router = express.Router();

router.get('/', (req, res) => res.send('profile route'));
router.post('/', (req, res) => res.send('profile post route'));

module.exports = router;
