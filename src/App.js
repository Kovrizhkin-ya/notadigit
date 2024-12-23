import React, { useState, useEffect } from 'react';
import './App.css';
import uploadImage from './browse.png';
import browseIcon from './upload.svg';
import downloadImage from './download.png';

const url = process.env.REACT_APP_API_URL;;

const statusProgressMapping = {
  'Extracting staffline and symbols': 5,
  'Extracting layers of different symbols': 10,
  'Extracting noteheads': 15,
  'Analyzing notehead bboxes': 20,
  'Instantiating notes': 25,
  'Grouping noteheads': 30,
  'Extracting symbols': 35,
  'Extracting rhythm types': 40,
  'Building MusicXML document': 75,
  'File is ready': 100
};

function App() {
  const [file, setFile] = useState(null);
  const [isUploaded, setIsUploaded] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [progress, setProgress] = useState(0);
  const [fileId, setFileId] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');

  const handleFileDrop = (event) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files[0];
    setFile(droppedFile);
    setIsUploaded(true);
  };

  const handleBrowseClick = () => {
    document.getElementById('fileInput').click();
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    setFile(selectedFile);
    setIsUploaded(true);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleConvert = () => {
    if (file) {
      uploadFile(file);
    }
  };

  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${url}/api/sendFile`, {
        method: 'POST',
        body: formData,
        headers: {
          "ngrok-skip-browser-warning": "any-value"
        }
      });

      if (response.ok) {
        const data = await response.json();
        setFileId(data.file_id);
        checkFileStatus(data.file_id);
      } else {
        console.error('File upload failed.');
      }
    } catch (error) {
      console.error('Failed to fetch:', error);
    }
  };

  const checkFileStatus = async (fileId) => {
    setProcessing(true);

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`${url}/api/checkFileStatus/${fileId}`, {
          headers: {
            "ngrok-skip-browser-warning": "any-value"
          }
        });

        if (response.ok) {
          const text = await response.text();
          const data = JSON.parse(text);
          const message = data.message;

          setStatusMessage(message);

          if (statusProgressMapping[message] !== undefined) {
            setProgress(statusProgressMapping[message]);
          }

          if (message === 'File is ready') {
            clearInterval(interval);
            setProcessing(false);
            setDownloadUrl(`${url}/api/getFile/${fileId}`);
          } else if (message === 'Failed') {
            clearInterval(interval);
            setProcessing(false);
            console.error('File processing failed.');
          }
        } else {
          console.error('Failed to check file status.');
        }
      } catch (error) {
        clearInterval(interval);
        setProcessing(false);
        console.error('Failed to fetch:', error);
      }
    }, 5000);
  };

  const handleDownload = () => {
    if (downloadUrl) {
      // Create a fetch request with custom headers
      fetch(downloadUrl, {
        method: 'GET',
        headers: {
          "ngrok-skip-browser-warning": "any-value"
        }
      })
      .then(response => response.blob()) // Get the response as a blob
      .then(blob => {
        const a = document.createElement('a');
        const originalFileName = file.name;
        const fileNameWithoutExtension = originalFileName.substring(0, originalFileName.lastIndexOf('.'));
        const newFileName = `${fileNameWithoutExtension}.musicxml`;
  
        // Create a download link for the blob
        a.href = URL.createObjectURL(blob);
        a.download = newFileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      })
      .catch(error => {
        console.error('Download failed:', error);
      });
    }
  };
  

  const handleReset = () => {
    setFile(null);
    setIsUploaded(false);
    setProcessing(false);
    setDownloadUrl(null);
    setProgress(0);
    setFileId(null);
    setStatusMessage('');
  };

  return (
    <div className="App">
      <div
        className="upload-container"
        onDrop={handleFileDrop}
        onDragOver={handleDragOver}
      >
        {!downloadUrl && !isUploaded && (
          <div className="upload-box">
            <img src={uploadImage} alt="Upload" className="upload-image" />
            <p className="upload-text">Drop, Upload, or Paste file</p>
            <p className="upload-supported">Supported formats: PNG, JPG, JFIF (JPEG), GIF</p>
            <button className="browse-btn" onClick={handleBrowseClick}>
              <img src={browseIcon} alt="Browse" className="browse-icon" />
              <span className="browse-text">Browse</span>
            </button>
            <input
              id="fileInput"
              type="file"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </div>
        )}

        {isUploaded && !downloadUrl && !processing && (
          <div className="convert-box">
            <p className="convert-near-text">{file.name}</p>
            <button className="convert-btn" onClick={handleConvert}>
              Convert
            </button>
          </div>
        )}

        {processing && (
          <div className="progress-block">
            <div className="progress-message">
              <p className="status-message">{statusMessage}</p>  
            </div>
            <div className="progress-container">
              <div className="progress-bar" style={{ width: `${progress}%` }}>
                {progress}%
              </div>
            </div>
          </div>
        )}

        {downloadUrl && !processing && (
          <div className="download-container" onClick={handleDownload}>
            <img src={downloadImage} alt="Download" className="download-image" />
            <span className="download-link">Download</span>
          </div>
        )}

        {downloadUrl && (
          <div className="reset-link-container">
            <a href="#" className="reset-link" onClick={handleReset}>
              New upload
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
