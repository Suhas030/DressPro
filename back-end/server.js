const express = require('express');
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cors = require('cors');
const path = require('path');
const ratingRoutes = require('./ratingRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Import User model and routes
const User = require('./User');
const productRoutes = require('./productRoutes');

const mime = require('mime');
mime.define({ 'application/octet-stream': ['onnx'] });

// server.js (FIX)
const userRoutes = require('./userRoutes');
app.use('/api/users', userRoutes);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Middleware
app.use(express.json());
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'https://dresspro-front-end.onrender.com'],
  credentials: true
}));

// Serve static files from the public folder
app.use(express.static(path.join(__dirname, 'public')));

// Session middleware
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 // 1 day
  }
}));

// Serve static files from the public folder
app.use(express.static(path.join(__dirname, 'public')));

// Add this line to specifically serve model files
app.use('/models', express.static(path.join(__dirname, 'public/models')));

// API route to serve model files
app.get('/api/models/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'public/models', filename);
  
  // Check if file exists
  if (!require('fs').existsSync(filePath)) {
    return res.status(404).json({ error: 'Model file not found' });
  }
  
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('Error serving model file:', err);
      res.status(500).json({ error: 'Error serving model file' });
    }
  });
});

// Debug route
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

// User routes
app.post('/api/users/register', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user with empty details
    user = new User({
      name,
      email,
      password,
      details: {
        age: null,
        topSize: '',
        bottomSize: ''
      }
    });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/users/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Store user in session
    req.session.user = {
      id: user._id,
      name: user.name,
      email: user.email
    };
    
    res.json({ message: 'Login successful' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/users/profile', async (req, res) => {
  try {
    // Exclude password from the response
    const user = await User.findById(req.session.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/users/update-details', async (req, res) => {
  try {
    const { age, topSize, bottomSize } = req.body;
    
    // Validate inputs
    if (age && (isNaN(age) || age < 1 || age > 120)) {
      return res.status(400).json({ message: 'Age must be between 1 and 120' });
    }
    
    const validSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', ''];
    if ((topSize && !validSizes.includes(topSize)) || 
        (bottomSize && !validSizes.includes(bottomSize))) {
      return res.status(400).json({ message: 'Invalid size selection' });
    }
    
    // Find user and update details
    const user = await User.findById(req.session.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Initialize details object if it doesn't exist
    if (!user.details) {
      user.details = {};
    }
    
    // Update only provided fields
    if (age !== undefined) user.details.age = age;
    if (topSize !== undefined) user.details.topSize = topSize;
    if (bottomSize !== undefined) user.details.bottomSize = bottomSize;
    
    await user.save();
    
    res.json({ 
      message: 'Profile updated successfully',
      user: {
        name: user.name,
        email: user.email,
        details: user.details
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/users/auth-status', (req, res) => {
  if (req.session.user) {
    return res.json({ isAuthenticated: true, user: req.session.user });
  }
  return res.status(401).json({ isAuthenticated: false });
});

app.post('/api/users/logout', (req, res) => {
  req.session.destroy();
  res.json({ message: 'Logged out successfully' });
});

// IMPORTANT: Use the product routes
app.use('/', productRoutes);

// Routes
app.use('/api', ratingRoutes);  // Add the rating routes

// Print available routes for debugging
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Available routes:');
  app._router.stack.forEach(r => {
    if (r.route && r.route.path) {
      console.log(`${Object.keys(r.route.methods)[0]} ${r.route.path}`);
    } else if (r.name === 'router') {
      r.handle.stack.forEach(layer => {
        if (layer.route) {
          const method = Object.keys(layer.route.methods)[0].toUpperCase();
          console.log(`${method} ${layer.route.path}`);
        }
      });
    }
  });
});
