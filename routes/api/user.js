const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');

const User = require('../../models/User');

const { check, validationResult } = require('express-validator');

// @route   POST api/user
// @desc    Create a user
// @access  Private
router.post(
    '/',
    [
        check('name', 'Name is required').not().isEmpty(),
        check('email', 'Email must be valid').isEmail(),
        check('password', 'Password must have 6 or more characters').isLength({
            min: 6,
        }),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, email, password } = req.body;
        try {
            // check if user already exists
            let user = await User.findOne({ email });

            if (user) {
                return res.status(400).json({
                    errors: [{ msg: 'User already exists' }],
                });
            }

            // get gravatar
            const avatar = gravatar.url(email, {
                s: '200',
                r: 'pg',
                d: 'mm',
            });

            // create user object
            user = new User({
                name,
                email,
                password,
                avatar,
            });

            // encrypt password
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);

            // insert the user object into the database
            await user.save();

            // create payload for jwt sign function
            const payload = {
                user: {
                    id: user.id,
                },
            };

            // generate a jwt
            jwt.sign(
                payload,
                config.get('jwtSecret'), // pass in our secret from /config/default.json
                {
                    expiresIn: 3600, // seconds until expiration
                },
                (err, token) => {
                    // callback function to handle token response
                    if (err) throw err;
                    res.json({ token }); // return token to client
                }
            );
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server error');
        }
    }
);

module.exports = router;
