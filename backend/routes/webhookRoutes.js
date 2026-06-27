const express = require('express');
const { verifySignature, handleWebhook } = require('../controllers/webhookController');

const router = express.Router();

// POST /api/github/webhook - endpoint for GitHub webhook deliveries
router.post('/', verifySignature, handleWebhook);

module.exports = router;
