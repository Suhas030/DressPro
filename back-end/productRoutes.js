const express = require('express');
const router = express.Router();
const Product = require('./app/product');
const fetch = require('node-fetch');

// API endpoint for product subcategories
router.get('/api/product-subcategories', async (req, res) => {
  try {
    const { clothingClass, gender } = req.query;
    if (!clothingClass) {
      return res.status(400).json({ message: 'Clothing class is required' });
    }
    
    console.log(`Fetching subcategories for: ${clothingClass}, gender: ${gender || 'all'}`);
    
    // Get unique product types for the clothing class - use case-insensitive regex
    const productTypes = await Product.distinct('product_type', { 
      clothing_class: { $regex: new RegExp(clothingClass, 'i') }
    });
    
    console.log(`Found ${productTypes.length} product types for ${clothingClass}`);
    
    // Format response as expected by the frontend
    res.json({ subcategories: productTypes });
  } catch (error) {
    console.error('Error fetching product subcategories:', error);
    res.status(500).json({ message: 'Error fetching product subcategories' });
  }
});

// API endpoint for product recommendations
router.get('/api/product-recommendations', async (req, res) => {
  try {
    const { clothingClass, productType, gender, colors, limit = 8 } = req.query;
    
    console.log(`Fetching recommendations for: ${clothingClass}, type: ${productType}, gender: ${gender}`);
    
    if (!clothingClass) {
      return res.status(400).json({ message: 'Clothing class is required' });
    }
    
    // Parse colors if provided as JSON string
    let colorFilters = [];
    if (colors) {
      try {
        colorFilters = JSON.parse(colors);
        // Convert RGB values to simple color names
        colorFilters = colorFilters.map(color => getNearestColor(color));
        console.log(`Using colors: ${colorFilters.join(', ')}`);
      } catch (e) {
        console.error('Error parsing colors:', e);
      }
    }
    
    // Build query with more flexible matching
    const query = { 
      // Use regex for case-insensitive partial matching on clothing_class
      clothing_class: { $regex: new RegExp(clothingClass.split(' ').join('|'), 'i') }
    };
    
    // Add product type filter if provided, also with more flexible matching
    if (productType) {
      query.product_type = { $regex: new RegExp(productType, 'i') };
    }
    
    // Add gender filter if provided and not "all"
    if (gender && gender !== 'all') {
      // Map frontend gender to database gender values
      const genderMap = {
        'male': 'men',
        'female': 'women'
      };
      
      const mappedGender = genderMap[gender] || gender;
      
      // For "men" and "women", also include "unisex" products
      if (mappedGender === 'men' || mappedGender === 'women') {
        query.gender = { $in: [mappedGender, 'unisex'] };
      } else {
        query.gender = mappedGender;
      }
    }
    
    // Make color matching optional to increase chances of finding products
    if (colorFilters && colorFilters.length > 0) {
      // Use $or to make colors optional but preferred
      query.$or = [
        { color: { $in: colorFilters } },
        { color: { $exists: true } }  // fallback to any color
      ];
    }
    
    console.log('Final query:', JSON.stringify(query));
    
    // Fetch recommendations with limit, sort by relevance then rating
    const products = await Product.find(query)
      .limit(parseInt(limit) || 8)
      .sort({ average_rating: -1 });
    
    console.log(`Found ${products.length} products matching the criteria`);
    
    // If no products found with the current query, try a broader search
    if (products.length === 0) {
      console.log("No products found with initial criteria, trying broader search...");
      
      // Create a broader query focusing just on the clothing class
      const broadQuery = {
        clothing_class: { $regex: new RegExp(clothingClass.split(' ')[0], 'i') }
      };
      
      if (gender && gender !== 'all') {
        const genderMap = {
          'male': 'men',
          'female': 'women'
        };
        const mappedGender = genderMap[gender] || gender;
        broadQuery.$or = [
          { gender: mappedGender },
          { gender: 'unisex' }
        ];
      }
      
      console.log('Broader query:', JSON.stringify(broadQuery));
      
      const broadResults = await Product.find(broadQuery)
        .limit(parseInt(limit) || 8)
        .sort({ average_rating: -1 });
        
      console.log(`Found ${broadResults.length} products with broader criteria`);
      
      // Format products for frontend consumption
      if (broadResults.length > 0) {
        const formattedProducts = broadResults.map(product => ({
          id: product._id.toString(),
          name: product.title,
          price: `$${product.price.toFixed(2)}`,
          image_url: product.image_url,
          url: product.product_url || '#',
          brand: product.brand || '',
          color: product.color || '',
          type: product.product_type
        }));
        
        return res.json({ products: formattedProducts });
      }
    }
    
    // Format products with proper image URLs
    const formattedProducts = products.map(product => {
      // Clean and validate the image URL
      let imageUrl = product.image_url;
      
      // Log the original URL
      console.log(`Original image URL for product ${product._id}: ${imageUrl}`);
      
      // Check if URL is valid and not relative
      if (imageUrl && typeof imageUrl === 'string' && !imageUrl.startsWith('/')) {
        // Check if URL starts with http or https
        if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
          // Add https:// if missing
          imageUrl = 'https://' + imageUrl;
          console.log(`Fixed image URL: ${imageUrl}`);
        }
      } else {
        // Use a reliable placeholder if URL is invalid
        imageUrl = `https://placehold.co/400x500/gray/white?text=${encodeURIComponent(product.product_type || 'Product')}`;
        console.log(`Using fallback image for ${product._id}: ${imageUrl}`);
      }
      
      return {
        id: product._id.toString(),
        name: product.title || 'Product',
        price: product.price ? `$${product.price.toFixed(2)}` : '$29.99',
        image_url: imageUrl,
        url: product.product_url || '#',
        brand: product.brand || '',
        color: product.color || '',
        type: product.product_type || ''
      };
    });
    
    res.json({ products: formattedProducts });
  } catch (error) {
    console.error('Error fetching product recommendations:', error);
    res.status(500).json({ message: 'Error fetching product recommendations' });
  }
});

// Replace the existing image proxy endpoint

router.get('/api/image-proxy', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }
    
    console.log(`Proxying image from: ${url}`);
    
    // Set proper CORS headers
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    
    try {
      const response = await fetch(url, {
        headers: {
          // Add headers that look like a normal browser request
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': 'https://www.amazon.com/'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Image fetch failed: ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type');
      
      // Set appropriate headers
      res.set('Content-Type', contentType || 'image/jpeg');
      res.set('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
      
      // Pipe the image data to response
      response.body.pipe(res);
    } catch (fetchError) {
      console.error(`Error fetching image from ${url}:`, fetchError.message);
      res.status(500).json({ error: 'Failed to fetch image' });
    }
  } catch (error) {
    console.error('Image proxy error:', error);
    res.status(500).json({ error: 'Image proxy error' });
  }
});

// Add this new endpoint specifically for Amazon images

router.get('/api/amazon-image', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }
    
    console.log(`Fetching Amazon image: ${url}`);
    
    // Set proper headers
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    
    try {
      const response = await fetch(url, {
        headers: {
          // These headers are important for Amazon's CDN
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': 'https://www.amazon.com/',
          'Origin': 'https://www.amazon.com'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Amazon image fetch failed: ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type');
      const buffer = await response.arrayBuffer();
      
      // Send as binary data with proper content type
      res.set('Content-Type', contentType || 'image/jpeg');
      res.set('Content-Length', buffer.byteLength);
      res.set('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
      
      res.send(Buffer.from(buffer));
    } catch (fetchError) {
      console.error(`Error fetching Amazon image: ${fetchError.message}`);
      res.status(500).json({ error: 'Failed to fetch image from Amazon' });
    }
  } catch (error) {
    console.error('Amazon image proxy error:', error);
    res.status(500).json({ error: 'Amazon image proxy error' });
  }
});

// Helper function to normalize RGB to standard color name
function getNearestColor(rgbString) {
  // Extract RGB values from string like 'rgb(255,0,0)'
  let rgb = rgbString.match(/\d+/g);
  if (!rgb || rgb.length < 3) return 'black';
  
  const r = parseInt(rgb[0]);
  const g = parseInt(rgb[1]);
  const b = parseInt(rgb[2]);
  
  // Define basic colors with their RGB values
  const colors = {
    'black': [0, 0, 0],
    'white': [255, 255, 255],
    'red': [255, 0, 0],
    'green': [0, 128, 0],
    'blue': [0, 0, 255],
    'yellow': [255, 255, 0],
    'purple': [128, 0, 128],
    'pink': [255, 192, 203],
    'orange': [255, 165, 0],
    'brown': [165, 42, 42],
    'grey': [128, 128, 128],
    'navy': [0, 0, 128],
    'beige': [245, 245, 220]
  };
  
  // Find the nearest color using Euclidean distance
  let nearestColor = 'black';
  let minDistance = Number.MAX_VALUE;
  
  for (const [color, [cr, cg, cb]] of Object.entries(colors)) {
    const distance = Math.sqrt(
      Math.pow(r - cr, 2) + 
      Math.pow(g - cg, 2) + 
      Math.pow(b - cb, 2)
    );
    
    if (distance < minDistance) {
      minDistance = distance;
      nearestColor = color;
    }
  }
  
  return nearestColor;
}

module.exports = router;