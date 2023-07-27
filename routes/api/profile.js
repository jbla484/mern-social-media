const express = require('express');
const router = express.Router();

const auth = require('../../middleware/auth');

const request = require('request');
const config = require('config');

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

// @route   GET api/profile/user/:user_id
// @desc    Get profile ny user ID
// @access  Public
router.get('/user/:user_id', async (req, res) => {
    try {
        //get all profiles by pulling the user ID from the URL
        const profile = await Profile.findOne({ user: req.params.user_id })
            // populate the object with the name and avatar from the database query
            .populate([
                { path: 'user', strictPopulate: false, select: 'name avatar' },
            ]);

        if (!profile) {
            return res.status(400).json({ msg: 'Profile not found.' });
        }

        // return the profiles back to the client
        res.json(profile);
    } catch (err) {
        // print and return caught error
        console.error(err.message);

        if (err.kind == 'ObjectId') {
            return res.status(400).json({ msg: 'Profile not found.' });
        }

        res.status(500).send('Server error');
    }
});

// @route   DELETE api/profile
// @desc    Delete profile, user, and posts
// @access  Private
router.delete('/', auth, async (req, res) => {
    try {
        // remove profile by user id
        await Profile.findOneAndRemove({ user: req.user.id });

        // remove user by user id
        await User.findOneAndRemove({ _id: req.user.id });

        // return the profiles back to the client
        res.json({ msg: 'User removed' });
    } catch (err) {
        // print and return caught error
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   PUT api/profile/experience
// @desc    Add profile experience
// @access  Private
router.put(
    '/experience',
    [
        auth,
        [
            check('title', 'Title is required').not().isEmpty(),
            check('company', 'Company is required').not().isEmpty(),
            check('from', 'From date is required').not().isEmpty(),
        ],
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { title, company, location, from, to, current, description } =
            req.body;

        const newExperience = {
            title,
            company,
            location,
            from,
            to,
            current,
            description,
        };

        try {
            const profile = await Profile.findOne({ user: req.user.id });
            profile.experience.unshift(newExperience);

            await profile.save();

            // return the profile back to the client
            res.json(profile);
        } catch (err) {
            // print and return caught error
            console.error(err.message);
            res.status(500).send('Server error');
        }
    }
);

// @route   DELETE api/profile/experience/:experience_id
// @desc    Delete experience from profile
// @access  Private
router.delete('/experience/:experience_id', auth, async (req, res) => {
    try {
        // find profile of the logged in user
        const profile = await Profile.findOne({
            user: req.user.id,
        });

        // find the index of the experience to be deleted
        const removeIndex = profile.experience
            .map((el) => el.id)
            .indexOf(req.params.experience_id);

        // remove the object from the array with the index
        profile.experience.splice(removeIndex, 1);

        // save the profile in the database
        await profile.save();

        // return the profile to the client
        res.json(profile);
    } catch (err) {
        // print and return caught error
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   PUT api/profile/education
// @desc    Add profile education
// @access  Private
router.put(
    '/education',
    [
        auth,
        [
            check('school', 'School is required').not().isEmpty(),
            check('degree', 'Degree is required').not().isEmpty(),
            check('fieldofstudy', 'Field of study is required').not().isEmpty(),
            check('from', 'From date is required').not().isEmpty(),
        ],
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { school, degree, fieldofstudy, from, to, current, description } =
            req.body;

        const newEducation = {
            school,
            degree,
            fieldofstudy,
            from,
            to,
            current,
            description,
        };

        try {
            const profile = await Profile.findOne({ user: req.user.id });
            profile.education.unshift(newEducation);

            await profile.save();

            // return the profile back to the client
            res.json(profile);
        } catch (err) {
            // print and return caught error
            console.error(err.message);
            res.status(500).send('Server error');
        }
    }
);

// @route   DELETE api/profile/education/:education_id
// @desc    Delete education from profile
// @access  Private
router.delete('/education/:education_id', auth, async (req, res) => {
    try {
        // find profile of the logged in user
        const profile = await Profile.findOne({
            user: req.user.id,
        });

        // find the index of the experience to be deleted
        const removeIndex = profile.education
            .map((el) => el.id)
            .indexOf(req.params.education_id);

        // remove the object from the array with the index
        profile.education.splice(removeIndex, 1);

        // save the profile in the database
        await profile.save();

        // return the profile to the client
        res.json(profile);
    } catch (err) {
        // print and return caught error
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET api/profile/github/:username
// @desc    Get user repos from Github
// @access  Public
router.get('/github/:username', async (req, res) => {
    try {
        const options = {
            url:
                'https://api.github.com/users/' +
                req.params.username +
                '/repos?per_page=5&sort=created:asc&client_id=' +
                config.get('githubclientid') +
                '&client_secret=' +
                config.get('githubSecret'),
            method: 'GET',
            headers: { 'user-agent': 'node-js' },
        };

        request(options, (error, response, body) => {
            if (error) console.error(error.message);

            if (response.statusCode !== 200)
                return res.status(404).json({ msg: 'No Github profile found' });

            return res.json(JSON.parse(body));
        });
    } catch (err) {
        // print and return caught error
        console.error(err.message);

        if (err.kind == 'ObjectId') {
            return res.status(400).json({ msg: 'Profile not found.' });
        }

        res.status(500).send('Server error');
    }
});

// export the router to other files
module.exports = router;
