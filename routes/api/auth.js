const express = require('express');
const router = express.Router();

router.get('/', (req, res) => res.send('auth route'));
router.post('/', (req, res) => res.send('auth post route'));

module.exports = router;
