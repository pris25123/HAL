import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = 'http://127.0.0.1:8000';

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [originalVideo, setOriginalVideo] = useState(null);
  const [processedData, setProcessedData] = useState(null);
  const [detectionResult, setDetectionResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [enlargedFrame, setEnlargedFrame] = useState(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
    setOriginalVideo(URL.createObjectURL(file));
    // Reset previous results
    setProcessedData(null);
    setDetectionResult(null);
    setError('');
  };

  const handleProcessVideo = async () => {
    if (!selectedFile) {
      setError('Please select a video file first.');
      return;
    }

    setIsLoading(true);
    setError('');
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      // 1. Upload video
      const uploadResponse = await axios.post(`${API_URL}/upload_video/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      const { filename } = uploadResponse.data;

      // 2. Process video
      const processFormData = new FormData();
      processFormData.append('filename', filename);
      const processResponse = await axios.post(`${API_URL}/process_video/`, processFormData);
      setProcessedData(processResponse.data);

    } catch (err) {
      setError('An error occurred during processing. Please check the console.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDetect = async () => {
    if (!processedData) {
      setError('Please process a video first.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    // Assumes filename can be derived from processed data, or re-use from upload
    const filename = originalVideo.split('/').pop(); 
    const detectFormData = new FormData();
    detectFormData.append('filename', selectedFile.name);


    try {
        const detectResponse = await axios.post(`${API_URL}/detect/`, detectFormData);
        setDetectionResult(detectResponse.data.result_video);
    } catch (err) {
        setError('An error occurred during detection. Please check the console.');
        console.error(err);
    } finally {
        setIsLoading(false);
    }
  };

  const handleClear = async () => {
      try {
          await axios.post(`${API_URL}/clear_folders/`);
          setSelectedFile(null);
          setOriginalVideo(null);
          setProcessedData(null);
          setDetectionResult(null);
          setError('');
          document.getElementById('file-input').value = '';
      } catch (err) {
          setError('Failed to clear server folders.');
          console.error(err);
      }
  };


  return (
    <div className="App">
      <header className="App-header">
        <h1>EO/IR Video Processing and Detection</h1>
      </header>
      <main>
        <div className="controls">
          <label htmlFor="file-input" className="custom-file-label">Choose File</label>
          <input id="file-input" type="file" onChange={handleFileChange} accept="video/*" />
          {selectedFile && (
            <span className="selected-file-name">{selectedFile.name}</span>
          )}
          <button onClick={handleProcessVideo} disabled={isLoading || !selectedFile}>
            {isLoading ? 'Processing...' : 'Process Video'}
          </button>
          <button onClick={handleDetect} disabled={isLoading || !processedData}>
            {isLoading ? 'Detecting...' : 'Run Detection'}
          </button>
           <button onClick={handleClear} disabled={isLoading}>Clear All</button>
        </div>

        {error && <p className="error">{error}</p>}

        <div className="video-grid">
          {originalVideo && (
            <div className="video-container">
              <h3>Original Video</h3>
              <video src={originalVideo} controls />
            </div>
          )}
          {processedData && (
            <div className="frames-row">
              {processedData.gray_frames?.length > 0 && (
                <div className="frame-container">
                  <h3>Grayscale First Frame</h3>
                  <img src={`${API_URL}/${processedData.gray_frames[0]}`} alt="Grayscale First Frame" />
                  <a href={`${API_URL}/download/?path=${encodeURIComponent(processedData.gray_video)}`}>
                    <button>Download Grayscale Video</button>
                  </a>
                </div>
              )}
              {processedData.thermal_frames?.length > 0 && (
                <div className="frame-container">
                  <h3>Thermal First Frame</h3>
                  <img src={`${API_URL}/${processedData.thermal_frames[0]}`} alt="Thermal First Frame" />
                  <a href={`${API_URL}/download/?path=${encodeURIComponent(processedData.thermal_video)}`}>
                    <button>Download Thermal Video</button>
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
        {processedData && (
  <div className="distance-section">
    <h3>Drone to Image Distances</h3>
    <div className="distance-image-wrapper">
      <img
        src="/assets/image.png"
        alt="Drone to Image Distances"
        className="distance-image"
      />
    </div>
    <div className="distance-text">
      <p>Drone Distance: <strong>42.92m</strong></p>
      <p>Base Distance: <strong>7.2m</strong></p>
    </div>
  </div>
)}


        {detectionResult && (
            <div className="results-container">
                <h2>Detection Result</h2>
                <a href={`${API_URL}/download/?path=${encodeURIComponent(detectionResult)}`}>
                  <button>Download Detected Video</button>
                </a>
            </div>
        )}

        {processedData && (
          <div className="frames-section">
            <div className="frames-card">
              <h3>Grayscale Frames</h3>
              <div className="frames-strip">
                {processedData.gray_frames.map((frame, index) => (
                  <img key={index} src={`${API_URL}/${frame}`} alt={`Grayscale Frame ${index}`} className="frame-thumb" onClick={() => setEnlargedFrame(`${API_URL}/${frame}`)} />
                ))}
              </div>
            </div>
            <div className="frames-card">
              <h3>Thermal Frames</h3>
              <div className="frames-strip">
                {processedData.thermal_frames.map((frame, index) => (
                  <img key={index} src={`${API_URL}/${frame}`} alt={`Thermal Frame ${index}`} className="frame-thumb" onClick={() => setEnlargedFrame(`${API_URL}/${frame}`)} />
                ))}
              </div>
            </div>
          </div>
        )}
        {/* Lightbox modal for enlarged frame */}
        {enlargedFrame && (
          <div className="lightbox-overlay" onClick={() => setEnlargedFrame(null)}>
            <div className="lightbox-modal" onClick={e => e.stopPropagation()}>
              <button className="lightbox-close" onClick={() => setEnlargedFrame(null)}>&times;</button>
              <img src={enlargedFrame} alt="Enlarged Frame" className="lightbox-img" />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
