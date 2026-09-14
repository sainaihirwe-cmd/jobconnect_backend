const express = require('express');
const { createFeedback } = require('../controllers/feedbackController');
const { optionalProtect } = require('../middleware/auth');

const router = express.Router();

router.post('/', optionalProtect, createFeedback);

module.exports = router;