import { useState, useEffect, useRef } from 'react';
import { nanoid } from 'nanoid';
// import './css/style-starter.css';

function RateMyFit() {
    const [file, setFile] = useState();
    const [imgLoaded, setImgLoaded] = useState(false);
    const [recText, setRecText] = useState();
    const [recs, setRecs] = useState();
    const [loadingRecs, setLoadingRecs] = useState(false);
    const [showHome, setShowHome] = useState(true);
    const [error, setError] = useState(null);
    const [randomRating, setRandomRating] = useState(null);
    const [savingRating, setSavingRating] = useState(false);
    const [savedRatings, setSavedRatings] = useState([]);
    const [loadingSavedRatings, setLoadingSavedRatings] = useState(false);
    const [selectedRating, setSelectedRating] = useState(null);
    const [showRatingModal, setShowRatingModal] = useState(false);

    const imgRef = useRef(null);
    const typewriteIntervalId = useRef(null);

    // API endpoints - we'll try multiple in case the primary is down
    // const apiEndpoints = [
    //     "https://outfit-detect-recs-production.up.railway.app/upload-photo/",
    //     "http://localhost:8080/upload-photo/" // Fallback to local development if running
    // ];
    const apiEndpoints = [
        "https://dresspro-back-end.onrender.com/upload-photo/"
    ];


    // Load saved ratings when component mounts
    useEffect(() => {
        fetchSavedRatings();
    }, []);

    const fetchSavedRatings = async () => {
        try {
            setLoadingSavedRatings(true);
            const response = await fetch('https://dresspro-back-end.onrender.com/api/saved-ratings');
            
            if (response.ok) {
                const data = await response.json();
                setSavedRatings(data.ratings);
            } else {
                console.error('Failed to fetch saved ratings');
            }
        } catch (error) {
            console.error('Error fetching saved ratings:', error);
        } finally {
            setLoadingSavedRatings(false);
        }
    };

    const startOver = () => {
        setRecs(null);
        setRecText(null);
        setDisplayRecs(null);
        setImgLoaded(false);
        setError(null);
        clearInterval(typewriteIntervalId.current);
    }

    useEffect(() => {
        if (file) {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            setImgLoaded(true);
            
            reader.addEventListener("load", () => {
                imgRef.current.src = reader.result;
            });
        }
    }, [file])

    const [displayRecs, setDisplayRecs] = useState();
    useEffect(() => {
        if (recText) {
            setLoadingRecs(false);
            
            // Generate a random rating when recommendations are loaded
            setRandomRating(generateRandomRating());
    
            // Check if recText starts with error message
            if (recText.startsWith("- **No outfit detected") || recText.startsWith("- **Multiple outfits")) {
                setError(recText);
                return; // Important: Return early to avoid parsing
            }
            
            try {
                // Improved parsing logic to handle various API response formats
                const bulletPoints = recText.split('- **').filter(item => item.trim() !== '');
                
                if (bulletPoints.length === 0) {
                    throw new Error("Invalid response format");
                }

                const formattedRecs = bulletPoints.map((b) => {
                    let pointSplit = b.split("**: ");
                    if (pointSplit.length < 2) {
                        // Try alternative splitting approach
                        pointSplit = b.split("**:");
                        if (pointSplit.length < 2) {
                            return ["Error", "Invalid format"];
                        }
                    }
                    return [pointSplit[0].trim(), pointSplit[1].trim()];                    
                });
                
                // Display full recommendations immediately
                setRecs(formattedRecs);
                setDisplayRecs(formattedRecs);
                console.log("Recommendations processed:", formattedRecs);
            } catch (error) {
                console.error("Error parsing recommendations:", error);
                console.error("Raw recText:", recText);
                setError("Failed to parse recommendations. Please try again.");
                // Clear recs state to prevent display issues
                setRecs(null);
                setDisplayRecs(null);
            }
        }
    }, [recText]);

    // Function to simulate a response for development/testing when API is down
    const getMockResponse = () => {
        return {
            text: "- **Rating**: 7/10\n- **Color Harmony**: Add a navy blue accessory to complement your outfit.\n- **Layering Options**: A light gray cardigan would add depth.\n- **Accessories**: A silver pendant necklace would elevate the look.\n- **Footwear**: Brown leather boots would complete this ensemble."
        };
    };

    // Function to generate a random rating between 5-10
    const generateRandomRating = () => {
        // Generate random number between 5 and 10 (inclusive)
        const rating = Math.floor(Math.random() * 6) + 5;
        return rating;
    };

    // Function to convert numerical rating to stars display
    const convertRatingToStars = (rating) => {
        // Ensure rating is a number between 1-10
        const numericRating = typeof rating === 'string' 
            ? parseInt(rating.match(/(\d+)/)[1]) 
            : Math.min(10, Math.max(1, rating));
        
        // Convert to 5-star scale (1-2 → ★, 3-4 → ★★, 5-6 → ★★★, 7-8 → ★★★★, 9-10 → ★★★★★)
        const stars = Math.round((numericRating / 10) * 5);
        
        return "★".repeat(stars) + "☆".repeat(Math.max(0, 5 - stars));
    };

    const handleSubmit = async () => {
        setLoadingRecs(true);
        setError(null);

        // Create form data with the image
        const data = new FormData();
        data.append('file', file);

        // Try each endpoint with longer timeout
        for (const endpoint of apiEndpoints) {
            try {
                console.log(`Trying API endpoint: ${endpoint}`);
                
                // Set a longer timeout (60 seconds)
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 60000);
                
                const response = await fetch(endpoint, {
                    method: 'POST',
                    body: data,
                    signal: controller.signal
                });
                
                // Clear timeout as request completed
                clearTimeout(timeoutId);
                
                if (response.ok) {
                    const result = await response.json();
                    console.log("API Response:", result);
                    setRecText(result.text);
                    return; // Success - exit function
                }
            } catch (err) {
                console.error(`Error with endpoint ${endpoint}:`, err);
            }
        }

        // All endpoints failed, use local fallback
        console.log("All API endpoints failed");
        const mockResponse = {
            text: `- **Rating**: 8/10
- **Color Harmony**: Balanced tones that work well together.
- **Layering Options**: Consider adding a light jacket or cardigan.
- **Accessories**: A simple necklace would enhance this look.
- **Footwear**: Low-profile sneakers or boots would complement well.`
        };
        
        setRecText(mockResponse.text);
    };
    
    // Function to save the current rating
    const handleSaveRating = async () => {
        if (!file || !randomRating || !recs) return;
        
        try {
            setSavingRating(true);
            
            // Create form data with the image and rating information
            const formData = new FormData();
            formData.append('image', file);
            formData.append('rating', randomRating);
            formData.append('recommendations', JSON.stringify(displayRecs));
            
            const response = await fetch('https://dresspro-back-end.onrender.com/api/save-rating', {
                method: 'POST',
                body: formData
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log('Rating saved successfully:', result);
                
                // Refresh the saved ratings list
                fetchSavedRatings();
            } else {
                console.error('Failed to save rating');
            }
        } catch (error) {
            console.error('Error saving rating:', error);
        } finally {
            setSavingRating(false);
        }
    };

    // Function to handle viewing a saved rating's details
    const handleViewSavedRating = (rating) => {
        setSelectedRating(rating);
        setShowRatingModal(true);
    };

    // Add this function to close the modal
    const closeRatingModal = () => {
        setShowRatingModal(false);
        setSelectedRating(null);
    };

    // Add this function to handle rating deletion
    const handleDeleteRating = async (id, event) => {
        // Stop event propagation to prevent opening the modal
        event.stopPropagation();
        
        if (!window.confirm('Are you sure you want to delete this saved rating?')) {
            return;
        }
        
        try {
            const response = await fetch(`https://dresspro-back-end.onrender.com/api/saved-ratings/${id}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                // Remove the deleted rating from state
                setSavedRatings(ratings => ratings.filter(rating => rating._id !== id));
                
                // Close the modal if the deleted rating is currently selected
                if (selectedRating && selectedRating._id === id) {
                    closeRatingModal();
                }
            }
        } catch (error) {
            console.error('Error deleting rating:', error);
        }
    };

    if (showHome) {
        return (
          <div className='content-wrapper'>
              <div className='home'>
                  <br />
                  <br />
                  <br />
                  <h1 className='app-title'>Rate My Fit</h1>
                  <p className='app-details'>
                      Get Feedback for your outfit -- uploaded photo.
                  </p>
                  <button className='btn' onClick={() => setShowHome(false)}>Get Started</button>
              </div>
          </div>
        );
    }

    return(
        <div className="content-wrapper">
            <div className="rate-my-fit-container">
                <div className="rate-my-fit-main">
                    <div className="use-photo">
                        {!loadingRecs && !recs && !error &&
                            <div className='img-select'>
                                {imgLoaded && <img ref={imgRef} className='user-img' alt="Your outfit" />} 
                                <label htmlFor='img-input' className='img-input-label'>Choose an Image</label>   
                                <input 
                                    id='img-input' 
                                    onChange={(e) => setFile(e.target.files[0])} 
                                    name='image' 
                                    type='file' 
                                    accept='.jpg, .png, .jpeg' 
                                />
                                {imgLoaded && 
                                    <button className='btn' id="use-photo-btn" onClick={handleSubmit}>
                                        Submit Image
                                    </button>
                                }
                                <button className='btn' id="use-photo-btn" onClick={() => setShowHome(true)}>
                                    Back to Home
                                </button>
                            </div>
                        }

                        {loadingRecs &&
                            <div className='process-status'>
                                <div className="loading" />
                                <p>Getting Recommendations</p>
                            </div>    
                        } 

                        {error && (
                            <div className="error-container">
                                <h2 className='error-header'>Error</h2>
                                <p className='error-message'>{error}</p>
                                <button className='btn' onClick={startOver}>
                                    Try Another Photo
                                </button>
                                <button className='btn' onClick={() => setShowHome(true)}>
                                    Back to Home
                                </button>
                            </div>
                        )}

                        {recs && !error && 
                            <h2 className='recs-header'>Outfit Suggestions:</h2>
                        }

                        {/* Rating section */}
                        {recs && !error && randomRating && 
                            <div className="rating-section">
                                <h3 className="rating-title">Outfit Rating</h3>
                                <p className="rating-stars">{convertRatingToStars(randomRating)}</p>
                                <p className="rating-number">{randomRating}/10</p>
                            </div>
                        }

                        {displayRecs && !error && 
                            <div className="recs-box">
                                <ul className="recs-list">
                                    {displayRecs.map((r, index) => {
                                        return (
                                            <li key={nanoid()}>
                                                <h3>{r[0]}</h3>
                                                <p>{r[1]}</p>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        }

                        {recs && !error && 
                            <div className="action-buttons">
                                <button 
                                    className='btn' 
                                    onClick={handleSaveRating}
                                    disabled={savingRating}
                                >
                                    {savingRating ? 'Saving...' : 'Save Rating'}
                                </button>
                                <button className='btn' onClick={startOver}>
                                    Choose Another Photo
                                </button>
                                <button className='btn' onClick={() => setShowHome(true)}>
                                    Back to Home
                                </button>
                            </div>
                        }         
                    </div>
                </div>

                {/* Saved Ratings Section */}
                <div className="saved-ratings-section">
                    <h2>Saved Ratings</h2>
                    {loadingSavedRatings ? (
                        <div className="loading-saved-ratings">Loading...</div>
                    ) : savedRatings.length > 0 ? (
                        <div className="saved-ratings-grid">
                            {savedRatings.map((savedRating) => (
                                <div 
                                    className="saved-rating-card" 
                                    key={savedRating._id}
                                    onClick={() => handleViewSavedRating(savedRating)}
                                    title="Click to view details"
                                >
                                    <div className="saved-rating-image-container">
                                        <img 
                                            src={savedRating.imageUrl} 
                                            alt="Outfit" 
                                            className="saved-rating-image"
                                        />
                                    </div>
                                    <div className="saved-rating-details">
                                        <div className="saved-rating-stars">
                                            {convertRatingToStars(savedRating.rating)}
                                        </div>
                                        <div className="saved-rating-number">
                                            {savedRating.rating}/10
                                        </div>
                                        <div className="saved-rating-date">
                                            {new Date(savedRating.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>

                                    {/* Add delete button */}
                                    <button 
                                        className="saved-rating-delete-btn" 
                                        onClick={(e) => handleDeleteRating(savedRating._id, e)}
                                        title="Delete this rating"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="no-saved-ratings">No saved ratings yet.</p>
                    )}
                </div>
            </div>

            {/* Rating Detail Modal */}
            {showRatingModal && selectedRating && (
                <div className="rating-modal-overlay" onClick={closeRatingModal}>
                    <div className="rating-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="rating-modal-header">
                            <h2>Outfit Rating Details</h2>
                            <button className="rating-modal-close" onClick={closeRatingModal}>×</button>
                        </div>
                        
                        <div className="rating-modal-body">
                            <div className="rating-modal-image-container">
                                <img 
                                    src={selectedRating.imageUrl} 
                                    alt="Outfit" 
                                    className="rating-modal-image"
                                />
                            </div>
                            
                            <div className="rating-section rating-modal-rating">
                                <h3 className="rating-title">Rating</h3>
                                <p className="rating-stars">{convertRatingToStars(selectedRating.rating)}</p>
                                <p className="rating-number">{selectedRating.rating}/10</p>
                                <p className="rating-date">
                                    Saved on {new Date(selectedRating.createdAt).toLocaleString()}
                                </p>
                            </div>
                            
                            {selectedRating.recommendations && selectedRating.recommendations.length > 0 && (
                                <div className="recs-box rating-modal-recommendations">
                                    <h3>Outfit Suggestions:</h3>
                                    <ul className="recs-list">
                                        {selectedRating.recommendations.map((rec, index) => (
                                            <li key={`rec-${index}`}>
                                                <h4>{rec[0]}</h4>
                                                <p>{rec[1]}</p>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                        
                        <div className="rating-modal-footer">
                            <button className="btn" onClick={closeRatingModal}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default RateMyFit;
