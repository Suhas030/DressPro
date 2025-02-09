import { useState, useEffect, useRef } from 'react';
import { nanoid } from 'nanoid';
// import './css/UsePhoto.css';

function RateMyFit() {
    const [file, setFile] = useState();
    const [imgLoaded, setImgLoaded] = useState(false);
    const [recText, setRecText] = useState();
    const [recs, setRecs] = useState();
    const [loadingRecs, setLoadingRecs] = useState(false);
    const [showHome, setShowHome] = useState(true);

    const imgRef = useRef(null);
    const typewriteIntervalId = useRef(null);

    const startOver = () => {
        setRecs(null);
        setRecText(null);
        setDisplayRecs(null);
        setImgLoaded(false);
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
    
            const bulletPoints = recText.split('- **').splice(1);

            setRecs(bulletPoints.map((b) => {
                let pointSplit = b.split("**: ");
                return [pointSplit[0], pointSplit[1].trim()];                    
            }));

            setDisplayRecs(bulletPoints.map(() => ["", ""]));                
        }
    }, [recText]);

    const typewriteEffect = (intervalId) => {
        let i = 0;
        let j = 0;
        let c = 0;

        intervalId.current = setInterval(() => {
            if (i < recs.length) {
                if (j < recs[0].length) {
                    if (c < recs[i][j].length) {
                        setDisplayRecs(displayRecs.map((r) => {
                            if (r[j] === displayRecs[i][j]) {
                                r[j] += recs[i][j][c];
                            }
                            return r;
                        }));
                        c++;
                    } else {
                        j++;
                        c = 0;
                    }   
                } else {
                    i++;
                    j = 0;
                }
            } else {
                return;
            }
        }, 8);
    };

    useEffect(() => {
        if (displayRecs && displayRecs[0][0] === '') {
            typewriteEffect(typewriteIntervalId);
            
            if (typewriteIntervalId) return () => clearInterval(typewriteIntervalId);            
        }
    }, [displayRecs])

    const handleSubmit = async () => {
        setLoadingRecs(true);
        const formData = new FormData();
        formData.append("file", file);

        const options = {
            method: "POST",
            body: formData
        }

        const response = await (await fetch("https://outfit-detect-recs-production.up.railway.app/upload-photo/", options)).json();
        setRecText(response.text);
    }

    if (showHome) {
        return (
            <div className='home'>
                <h1 className='app-title'>Dress Pro Model</h1>
                <p className='app-details'>
                    Get Feedback for your outfit -- uploaded photo.
                </p>
                <button className='btn' onClick={() => setShowHome(false)}>Get Started</button>
            </div>
        );
    }

    return(
        <div className="use-photo">
            {!loadingRecs && !recs &&
                <div className='img-select'>
                    {imgLoaded && <img ref={imgRef} className='user-img' />} 
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

            {recs && 
                <h2 className='recs-header'>Outfit Recommendations:</h2>
            }

            {displayRecs && 
                <div className="recs-box">
                    <ul className="recs-list">
                        {displayRecs.map((r) => 
                            <li key={nanoid()}>
                                <h3>{r[0]}</h3>
                                <p>{r[1]}</p>
                            </li>                            
                        )}
                    </ul>
                </div>
            }

            {recs && 
                <button className='btn' id="use-photo-btn" onClick={startOver}>
                    Choose Another Photo
                </button>
            }         
            {recs && 
                <button className='btn' id="use-photo-btn" onClick={() => setShowHome(true)}>
                    Back to Home
                </button>
            }
        </div>
    );
}

export default RateMyFit;