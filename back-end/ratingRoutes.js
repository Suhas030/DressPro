const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

// Define the saved rating schema
const savedRatingSchema = new mongoose.Schema({
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  recommendations: {
    type: Array,
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create the model
const SavedRating = mongoose.model('SavedRating', savedRatingSchema);

// Configure multer storage for images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'public', 'uploads');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp + random string + extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'outfit-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max file size
  fileFilter: (req, file, cb) => {
    // Only accept images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Save a new rating
router.post('/save-rating', upload.single('image'), async (req, res) => {
  try {
    const { rating, recommendations } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: 'No image file uploaded' });
    }
    
    if (!rating) {
      return res.status(400).json({ message: 'Rating is required' });
    }
    
    // Create the image URL - relative to the server
    const imageUrl = `/uploads/${req.file.filename}`;
    
    // Parse recommendations if it's a string
    let parsedRecommendations;
    try {
      parsedRecommendations = typeof recommendations === 'string' 
        ? JSON.parse(recommendations) 
        : recommendations || [];
        
      // Validate the structure
      if (!Array.isArray(parsedRecommendations)) {
        console.warn('Recommendations is not an array, converting:', parsedRecommendations);
        parsedRecommendations = [];
      }
      
      // Ensure each recommendation is in the expected format [title, content]
      parsedRecommendations = parsedRecommendations.filter(rec => 
        Array.isArray(rec) && rec.length === 2 && typeof rec[0] === 'string' && typeof rec[1] === 'string'
      );
      
      console.log('Saving recommendations:', parsedRecommendations);
    } catch (e) {
      console.error('Error parsing recommendations:', e, recommendations);
      parsedRecommendations = [];
    }
    
    // Create new saved rating
    const savedRating = new SavedRating({
      rating: Number(rating),
      recommendations: parsedRecommendations,
      imageUrl: imageUrl
    });
    
    await savedRating.save();
    
    res.status(201).json({ 
      message: 'Rating saved successfully',
      rating: savedRating 
    });
  } catch (error) {
    console.error('Error saving rating:', error);
    res.status(500).json({ message: 'Error saving rating', error: error.message });
  }
});

// Get all saved ratings
router.get('/saved-ratings', async (req, res) => {
  try {
    // Get the most recent ratings, limited to 20
    const ratings = await SavedRating.find()
      .sort({ createdAt: -1 })
      .limit(20)
      .exec();
      
    res.status(200).json({ ratings });
  } catch (error) {
    console.error('Error fetching saved ratings:', error);
    res.status(500).json({ message: 'Error fetching saved ratings', error: error.message });
  }
});

// Get a specific saved rating by ID
router.get('/saved-ratings/:id', async (req, res) => {
  try {
    const rating = await SavedRating.findById(req.params.id);
    
    if (!rating) {
      return res.status(404).json({ message: 'Rating not found' });
    }
    
    res.status(200).json({ rating });
  } catch (error) {
    console.error('Error fetching rating:', error);
    res.status(500).json({ message: 'Error fetching rating', error: error.message });
  }
});

// Delete a saved rating
router.delete('/saved-ratings/:id', async (req, res) => {
  try {
    const rating = await SavedRating.findById(req.params.id);
    
    if (!rating) {
      return res.status(404).json({ message: 'Rating not found' });
    }
    
    // Extract the filename from the imageUrl
    const filename = rating.imageUrl.split('/').pop();
    const imagePath = path.join(__dirname, 'public', 'uploads', filename);
    
    // Delete the image file
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }
    
    // Delete the rating from the database
    await SavedRating.findByIdAndDelete(req.params.id);
    
    res.status(200).json({ message: 'Rating deleted successfully' });
  } catch (error) {
    console.error('Error deleting rating:', error);
    res.status(500).json({ message: 'Error deleting rating', error: error.message });
  }
});

module.exports = router;