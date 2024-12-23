import React, { useState } from 'react';
import './App.css';
import uploadImage from './browse.png';
import browseIcon from './upload.svg';

// URL вашего сервера
const url = 'https://3f48-91-219-254-102.ngrok-free.app';

function App() {
  const [file, setFile] = useState(null);
  const [isUploaded, setIsUploaded] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [progress, setProgress] = useState(0);

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

  const simulateProcessing = () => {
    setProcessing(true);
    setProgress(0);

    const stages = [20, 40, 60, 80, 100];
    let currentStage = 0;

    const updateProgress = () => {
      if (currentStage < stages.length) {
        setProgress(stages[currentStage]);
        currentStage += 1;
        setTimeout(updateProgress, 1000); // Этапы будут обновляться каждые 1 секунду
      } else {
        setProcessing(false);
        setDownloadUrl(`${url}/download/fakeJobId`); // Используйте реальный URL после обработки
      }
    };

    updateProgress();
  };

  const handleConvert = async () => {
    if (file) {
      setProcessing(true);
      setProgress(0);
      const formData = new FormData();
      formData.append('file', file);

      try {
        // Отправка файла на сервер
        const response = await fetch(`${url}/upload`, {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const { jobId } = await response.json();

          // Имитируем обработку для отображения прогресса
          simulateProcessing();

          // Проверка состояния обработки
          const checkStatus = async () => {
            const statusResponse = await fetch(`${url}/status/${jobId}`);
            const statusData = await statusResponse.json();

            if (statusData.status === 'completed') {
              setDownloadUrl(`${url}/download/${jobId}`);
              setProcessing(false);
            } else {
              setTimeout(checkStatus, 5000); // Проверять каждые 5 секунд
            }
          };

          //checkStatus(); // Уберите комментарий для настоящей проверки
        } else {
          console.error('Ошибка при загрузке файла');
          setProcessing(false);
        }
      } catch (error) {
        console.error('Ошибка:', error);
        setProcessing(false);
      }
    }
  };

  return (
    <div className="App">
      <div
        className="upload-container"
        onDrop={handleFileDrop}
        onDragOver={handleDragOver}
      >
        {isUploaded ? (
          <div className="convert-box">
            <p className="convert-near-text">{file.name}</p>
            <button className="convert-btn" onClick={handleConvert} disabled={processing}>
              {processing ? 'Processing...' : 'Convert'}
            </button>
          </div>
        ) : (
          <div className="upload-box">
            <img src={uploadImage} alt="Upload" className="upload-image" />
            <p className="upload-text">Drop, Upload or Paste file</p>
            <p className="upload-supported">Supported formats: PDF, PNG, JPG, JFIF (JPEG)</p>
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
      </div>

      {processing && (
        <div className="progress-container">
          <div className="progress-bar" style={{ width: `${progress}%` }}>
            {progress}%
          </div>
        </div>
      )}

      {downloadUrl && (
        <div className="download-container">
          <a href={downloadUrl} download>
            Download Processed File
          </a>
        </div>
      )}
    </div>
  );
}

export default App;
