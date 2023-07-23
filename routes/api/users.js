const express = require('express');
const router = express.Router();

router.get('/', (req, res) => res.send('user route'));
router.post('/', (req, res) => res.send('user post route'));

module.exports = router;
