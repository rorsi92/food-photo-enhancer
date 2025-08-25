const express = require('express');
const router = express.Router();

// Simple auth routes for now - you can expand these later
router.post('/register', (req, res) => {
  // For now, just return success
  res.json({ 
    message: 'Registration successful',
    user: { id: '1', email: req.body.email }
  });
});

router.post('/login', (req, res) => {
  // For now, just return success
  res.json({ 
    message: 'Login successful',
    user: { id: '1', email: req.body.email },
    token: 'fake-jwt-token'
  });
});

module.exports = router;