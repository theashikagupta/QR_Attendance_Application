const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { User, USER_ROLES } = require('../models/User');

const router = express.Router();

const createToken = (user) => {
  const payload = {
    sub: user._id,
    role: user.role,
  };

  const secret = process.env.JWT_SECRET || 'dev_secret';
  const expiresIn = process.env.JWT_EXPIRES_IN || '8h';

  return jwt.sign(payload, secret, { expiresIn });
};

// Ensure default admin exists
const bootstrapAdmin = async () => {
  const email = process.env.DEFAULT_ADMIN_EMAIL || 'navneetkushwaha64@gmail.com';
  const password = process.env.DEFAULT_ADMIN_PASSWORD || 'notebook';

  let admin = await User.findOne({ email });
  if (!admin) {
    const passwordHash = await bcrypt.hash(password, 10);
    admin = await User.create({
      name: 'Default Admin',
      email,
      passwordHash,
      role: USER_ROLES.ADMIN,
    });
    console.log('Default admin created with email', email);
  }
};

bootstrapAdmin().catch((err) => console.error('Admin bootstrap failed', err));

router.post(
  '/login',
  [
    body('email').isEmail(),
    body('password').isLength({ min: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = createToken(user);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  }
);

module.exports = router;
