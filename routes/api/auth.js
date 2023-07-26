const express = require('express');
const bcrypt = require('bcryptjs');
const config = require('config');
const auth = require('../../middleware/auth');
const User = require('../../models/User');
const jwt = require('jsonwebtoken');

const router = express.Router();
const { check, validationResult } = require('express-validator');

// @route   GET api/auth
// @desc
// @access  Public
router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json({ user });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   POST api/auth
// @desc
// @access  Public
router.post(
    '/',
    // middleware function from 'express-validator' import that
    // checks the input object properties by name to ensure they meet a custom criteria
    [
        check('email', 'Email must be valid').isEmail(),
        check('password', 'Password required').exists(),
    ],
    async (req, res) => {
        // check if the request has any validation errors from the above middleware function and return error if it does
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        // destructure email and password from request body
        const { email, password } = req.body;

        try {
            // check if user already exists and return error if they do
            let user = await User.findOne({ email });
            if (!user) {
                return res.status(400).json({
                    errors: [{ msg: 'Invalid credentials' }],
                });
            }

            // compare encrypted password with plain text password and return error if they don't
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({
                    errors: [{ msg: 'Invalid credentials' }],
                });
            }

            // create payload for jwt sign function
            const payload = {
                user: {
                    id: user.id,
                },
            };

            // generate a jsonwebtoken
            jwt.sign(
                payload,
                // pass in our secret from /config/default.json
                config.get('jwtSecret'),
                {
                    // seconds until expiration
                    expiresIn: 3600,
                },
                // callback function to handle token response
                (err, token) => {
                    if (err) throw err;

                    // return token to client
                    res.json({ token });
                }
            );
        } catch (err) {
            // print and return caught error
            console.error(err.message);
            res.status(500).send('Server error');
        }
    }
);

module.exports = router;
