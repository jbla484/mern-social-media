const express = require('express');
const router = express.Router();

const auth = require('../../middleware/auth');

const UserModel = require('../../models/User');
const ProfileModel = require('../../models/Profile');

const { check, validationResult } = require('express-validator');

// @route   POST api/profile
// @desc    Create or update a user profile
// @access  Private
router.post(
    '/',
    // multiple middleware functions go in an array
    [
        // authorization middleware function imported from middleware/auth.js
        auth,
        // middleware function from 'express-validator' import that
        // checks the input object properties by name to ensure they meet a custom criteria
        [
            check('status', 'Status is required').not().isEmpty(),
            check('skills', 'Skills is required').not().isEmpty(),
        ],
    ],
    async (req, res) => {
        // check if the request has any validation errors from the above middleware function and return error if it does
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
    }
);

// @route   GET api/profile/me
// @desc    Get current users profile
// @access  Private
router.get('/me', auth, async (req, res) => {
    try {
        // search the database for a user profile
        const profile = await ProfileModel.findOne({
            user: req.user.id,
        })
            // populate the object with the name and avatar from the database query
            .populate('user', ['name', 'avatar']);

        // Return if no user profile found
        if (!profile) {
            return res
                .status(400)
                .json({ ermsgrors: 'There is no profile for this user' });
        }

        // Send the profile back to the client
        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   POST api/auth
// @desc
// @access  Public
router.post('/', (req, res) => res.send('profile post route'));

module.exports = router;
