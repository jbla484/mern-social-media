const express = require('express');
const router = express.Router();

// middleware functions
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');

// import the models required for a profile
const User = require('../../models/User');
const Profile = require('../../models/Profile');
const Post = require('../../models/Post');

// @route   POST api/posts
// @desc    Create a new post
// @access  Private
router.post(
    '/',
    [
        // authorization middleware function imported from middleware/auth.js
        auth,
        // middleware function from 'express-validator' import that
        // checks the input object properties by name to ensure they meet a custom criteria
        [check('text', 'Text is required').not().isEmpty()],
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const user = await User.findById(req.user.id).select('-password');

            const newPost = {
                text: req.body.text,
                name: user.name,
                avatar: user.avatar,
                user: req.user.id,
            };

            const post = await new Post(newPost).save();

            res.json(post);
        } catch (err) {
            // print and return caught error
            console.error(err.message);
            res.status(500).send('Server error');
        }
    }
);

// @route   GET api/post
// @desc    Get all posts
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const posts = await Post.find({}).sort({ date: -1 });

        res.json(posts);
    } catch (err) {
        // print and return caught error
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET api/post/:post_id
// @desc    Get post by id
// @access  Private
router.get('/:post_id', auth, async (req, res) => {
    try {
        const post = await Post.find({ _id: req.params.post_id });

        if (!post) {
            return res.status(404).json({ msg: 'No post found' });
        }
        res.json(post);
    } catch (err) {
        // print and return caught error
        console.error(err.message);

        if (err.kind == 'ObjectId') {
            return res.status(400).json({ msg: 'No post found' });
        }

        res.status(500).send('Server error');
    }
});

// @route   DELETE api/post
// @desc    Delete post
// @access  Private
router.delete('/:post_id', auth, async (req, res) => {
    try {
        // find post
        const post = await Post.findOneAndDelete({
            _id: req.params.post_id,
            user: req.user.id,
        });

        if (!post) {
            return res.status(400).json({ msg: 'No post found' });
        }

        // return the profiles back to the client
        res.json({ msg: 'Post removed' });
    } catch (err) {
        // print and return caught error
        console.error(err.message);

        if (err.kind == 'ObjectId') {
            return res.status(400).json({ msg: 'No post found' });
        }

        res.status(500).send('Server error');
    }
});

// @route   PUT api/post/like/:post_id
// @desc    Like a post
// @access  Private
router.put('/like/:post_id', auth, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const post = await Post.findOne({ _id: req.params.post_id });

        if (!post) {
            return res.status(400).json({ msg: 'No post found' });
        }

        if (
            post.likes.filter((el) => el.user.toString() === req.user.id)
                .length > 0
        ) {
            return res.status(400).json({ msg: 'Post already liked' });
        }

        post.likes.unshift({ user: req.user.id });

        await post.save();

        // return the post back to the client
        res.json(post.likes);
    } catch (err) {
        // print and return caught error
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   PUT api/post/unlike/:post_id
// @desc    Unlike a post
// @access  Private
router.put('/unlike/:post_id', auth, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        // find postb by id
        const post = await Post.findOne({ _id: req.params.post_id });

        if (!post) {
            return res.status(400).json({ msg: 'No post found' });
        }

        if (
            post.likes.filter((el) => el.user.toString() === req.user.id)
                .length > 0
        ) {
            // find like array index
            const removeIndex = post.likes
                .map((el) => el.id)
                .indexOf(req.params.post_id);

            // remove like
            post.likes.splice(removeIndex, 1);

            // save the post
            await post.save();

            // return the post likes back to the client
            res.json(post.likes);
        } else {
            return res.status(400).json({ msg: 'Post not liked' });
        }
    } catch (err) {
        // print and return caught error
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   PUT api/post/comment/:post_id
// @desc    Comment on a post
// @access  Private
router.put(
    '/comment/:post_id',
    [auth, [check('text', 'Text is required').not().isEmpty()]],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const user = await User.findOne({ _id: req.user.id });
            const post = await Post.findOne({ _id: req.params.post_id });

            if (!post) {
                return res.status(400).json({ msg: 'No post found' });
            }

            const newComment = {
                user: req.user.id,
                text: req.body.text,
                name: user.name,
                avatar: user.avatar,
            };

            post.comments.unshift(newComment);

            await post.save();

            // return the post back to the client
            res.json(post.comments);
        } catch (err) {
            // print and return caught error
            console.error(err.message);
            res.status(500).send('Server error');
        }
    }
);

// @route   PUT api/post/uncomment/:post_id/:comment_id
// @desc    Uncomment on a post
// @access  Private
router.put('/uncomment/:post_id/:comment_id', auth, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        // find post by id
        const post = await Post.findOne({ _id: req.params.post_id });

        if (!post) {
            return res.status(400).json({ msg: 'No post found' });
        }

        const comment = post.comments.find(
            (comment) => comment.id === req.params.comment_id
        );

        if (!comment) {
            return res.status(400).json({ msg: 'No comment found' });
        }

        // find like array index
        const removeIndex = post.comments
            .map((comment) => comment.id)
            .indexOf(req.params.comment_id);

        // remove comment
        post.comments.splice(removeIndex, 1);

        // save the post
        await post.save();

        // return the post comments back to the client
        res.json(post.comments);
    } catch (err) {
        // print and return caught error
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
