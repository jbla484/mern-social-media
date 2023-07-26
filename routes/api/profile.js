const express = require('express');
const router = express.Router();

const auth = require('../../middleware/auth');

// import the models required for a profile
const User = require('../../models/User');
const Profile = require('../../models/Profile');

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
            check('role', 'Role is required').not().isEmpty(),
            check('skills', 'Skills is required').not().isEmpty(),
        ],
    ],
    async (req, res) => {
        // check if the request has any validation errors from the above middleware function and return error if it does
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        // pull all properties out of request body
        const {
            company,
            website,
            location,
            bio,
            role,
            githubusername,
            skills,
            youtube,
            facebook,
            twitter,
            instagram,
            linkedin,
        } = req.body;

        // Build the profile object
        const profile = {};
        profile.user = req.user.id;
        if (company) profile.company = company;
        if (website) profile.website = website;
        if (location) profile.location = location;
        if (bio) profile.bio = bio;
        if (role) profile.role = role;
        if (githubusername) profile.githubusername = githubusername;
        if (skills) {
            profile.skills = skills.split(',').map((skill) => skill.trim());
        }

        // Build the profile social object
        profile.social = {};
        if (youtube) profile.social.youtube = youtube;
        if (facebook) profile.social.facebook = facebook;
        if (twitter) profile.social.twitter = twitter;
        if (instagram) profile.social.instagram = instagram;
        if (linkedin) profile.social.linkedin = linkedin;

        try {
            // check if profile already exists
            let userProfile = await Profile.findOne({
                user: profile.user,
            });

            // update profile if found
            if (userProfile) {
                userProfile = await Profile.findOneAndUpdate(
                    // find the profile by id
                    {
                        user: profile.user,
                    },
                    // set the fields with the profile object we created above
                    { $set: profile },
                    // create a new one
                    { new: true }
                );

                // return the profile to the client
                return res.json(userProfile);
            }

            // create profile if not found
            userProfile = new Profile(profile);

            // save profile to database
            await userProfile.save();

            // return profile to client
            res.json(userProfile);
        } catch (err) {
            // print and return caught error
            console.error(err.message);
            res.status(500).send('Server error');
        }
    }
);

// @route   GET api/profile/me
// @desc    Get current user's profile
// @access  Private
router.get('/me', auth, async (req, res) => {
    try {
        // search the database for a user profile, if found populate with user properties
        const profile = await Profile.findOne({
            user: req.user.id,
        })
            // populate the object with the name and avatar from the database query
            .populate([
                { path: 'user', strictPopulate: false, select: 'name avatar' },
            ]);

        // Return if no user profile found
        if (!profile) {
            return res
                .status(400)
                .json({ msg: 'There is no profile for this user' });
        }

        // Send the profile back to the client
        res.json(profile);
    } catch (err) {
        // print and return caught error
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET api/profile
// @desc    Get all profiles
// @access  Public
router.get('/', async (req, res) => {
    try {
        //get all profiles
        const profiles = await Profile.find({})
            // populate the object with the name and avatar from the database query
            .populate([
                { path: 'user', strictPopulate: false, select: 'name avatar' },
            ]);

        // return the profiles back to the client
        res.json(profiles);
    } catch (err) {
        // print and return caught error
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// export the router to other files
module.exports = router;
