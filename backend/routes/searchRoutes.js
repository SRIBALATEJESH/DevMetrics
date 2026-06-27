const express = require('express');
const { universalSearch } = require('../controllers/searchController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/search - Universal Search across all modules
router.get('/', protect, universalSearch);

module.exports = router;
