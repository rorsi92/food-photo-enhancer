import React, { useState, useRef } from 'react';
import axios from 'axios';

interface PhotoProgress {
  id: string;
  name: string;
  status: 'waiting' | 'processing' | 'completed' | 'error';
  progress: number;
  originalUrl?: string;
  enhancedUrl?: string;
  error?: string;
}

function App() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [photoProgress, setPhotoProgress] = useState<PhotoProgress[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (files: FileList | null) => {
    if (files) {
      const filesArray = Array.from(files);
      setSelectedFiles(filesArray);
      
      // Initialize progress for each photo
      const progressArray: PhotoProgress[] = filesArray.map((file, index) => ({
        id: `photo_${index}_${Date.now()}`,
        name: file.name,
        status: 'waiting',
        progress: 0
      }));
      setPhotoProgress(progressArray);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const enhancePhotos = async () => {
    if (selectedFiles.length === 0) return;
    
    setIsProcessing(true);
    
    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const photoId = photoProgress[i].id;
        
        // Update status to processing
        setPhotoProgress(prev => 
          prev.map(photo => 
            photo.id === photoId 
              ? { ...photo, status: 'processing', progress: 0 }
              : photo
          )
        );

        // Simulate progress
        const progressInterval = setInterval(() => {
          setPhotoProgress(prev => 
            prev.map(photo => 
              photo.id === photoId && photo.status === 'processing'
                ? { ...photo, progress: Math.min(photo.progress + 10, 90) }
                : photo
            )
          );
        }, 200);

        try {
          const formData = new FormData();
          formData.append('photo', file);

          const response = await axios.post(
            'http://localhost:5000/api/enhance/single',
            formData,
            {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
            }
          );

          console.log('✅ Frontend success:', response.data);
          clearInterval(progressInterval);

          // Update with success
          setPhotoProgress(prev => 
            prev.map(photo => 
              photo.id === photoId 
                ? { 
                    ...photo, 
                    status: 'completed', 
                    progress: 100,
                    originalUrl: `http://localhost:5000${response.data.originalUrl}`,
                    enhancedUrl: `http://localhost:5000${response.data.enhancedUrl}`
                  }
                : photo
            )
          );

        } catch (error) {
          clearInterval(progressInterval);
          
          console.error('❌ Frontend error:', error);
          const err = error as any;
          console.error('❌ Error response:', err?.response?.data);
          console.error('❌ Error status:', err?.response?.status);
          
          // Update with error
          setPhotoProgress(prev => 
            prev.map(photo => 
              photo.id === photoId 
                ? { 
                    ...photo, 
                    status: 'error', 
                    progress: 0,
                    error: err?.response?.data?.error || 'Erro ao processar imagem'
                  }
                : photo
            )
          );
        }
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadPhoto = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `enhanced_${filename}`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAll = () => {
    photoProgress.forEach(photo => {
      if (photo.status === 'completed' && photo.enhancedUrl) {
        setTimeout(() => downloadPhoto(photo.enhancedUrl!, photo.name), 500);
      }
    });
  };

  const resetAll = () => {
    setSelectedFiles([]);
    setPhotoProgress([]);
    setIsProcessing(false);
  };

  const completedPhotos = photoProgress.filter(photo => photo.status === 'completed');

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      {/* Background orbs */}
      <div className="background-orbs">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
      </div>

      {/* Header */}
      <header className="header">
        <div className="container">
          <div className="header-content">
            <div className="header-icon">
              <svg width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'white' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 className="header-title">Food Photo Enhancer</h1>
              <p className="header-subtitle">AI-Powered • Retro-Futuristic • Enhancement</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="main-content">
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: selectedFiles.length > 0 ? '1fr 1fr' : '1fr', gap: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
            
            {/* Upload Section - Left Side */}
            <div className="upload-card">
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h2 style={{ 
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  background: 'linear-gradient(45deg, #ec4899, #06b6d4)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  color: 'transparent',
                  marginBottom: '0.5rem'
                }}>
                  Upload suas Fotos
                </h2>
                <p style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                  Arraste ou clique para selecionar
                </p>
              </div>

              {/* Upload Square */}
              <div
                className={`upload-square ${isDragging ? 'dragging' : ''}`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: '100%',
                  height: '300px',
                  border: isDragging ? '3px dashed #ec4899' : '2px dashed rgba(139, 92, 246, 0.4)',
                  borderRadius: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  background: isDragging 
                    ? 'linear-gradient(135deg, rgba(236, 72, 153, 0.1), rgba(139, 92, 246, 0.1))'
                    : 'linear-gradient(135deg, rgba(75, 85, 99, 0.1), rgba(31, 41, 55, 0.1))',
                  transform: isDragging ? 'scale(1.02)' : 'scale(1)',
                  marginBottom: '2rem'
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => handleFileSelect(e.target.files)}
                />

                <div className="upload-icon" style={{ marginBottom: '1rem' }}>
                  <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'white' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem', color: 'white' }}>
                    {selectedFiles.length > 0 ? `${selectedFiles.length} foto(s) selecionada(s)` : 'Clique ou arraste fotos aqui'}
                  </h3>
                  <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem' }}>
                    JPG, PNG, WebP • Máx 10MB cada
                  </p>
                </div>
              </div>

              {/* Enhance Button */}
              {selectedFiles.length > 0 && (
                <button
                  onClick={enhancePhotos}
                  disabled={isProcessing}
                  className="enhance-button"
                  style={{
                    width: '100%',
                    padding: '1rem 2rem',
                    fontSize: '1.25rem',
                    fontWeight: 'bold',
                    background: isProcessing 
                      ? 'rgba(107, 114, 128, 0.5)' 
                      : 'linear-gradient(45deg, #10b981, #059669)',
                    border: 'none',
                    borderRadius: '12px',
                    color: 'white',
                    cursor: isProcessing ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: isProcessing ? 'none' : '0 8px 32px rgba(16, 185, 129, 0.3)'
                  }}
                >
                  {isProcessing ? 'Melhorando...' : 'Melhorar'}
                </button>
              )}

              {completedPhotos.length > 0 && (
                <button
                  onClick={resetAll}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    marginTop: '1rem',
                    background: 'transparent',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '8px',
                    color: 'rgba(255, 255, 255, 0.7)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                >
                  Nova Sessão
                </button>
              )}
            </div>

            {/* Progress Section - Right Side */}
            {selectedFiles.length > 0 && (
              <div className="upload-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                  <h2 style={{ 
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    color: 'white'
                  }}>
                    Progresso ({completedPhotos.length}/{photoProgress.length})
                  </h2>
                  
                  {completedPhotos.length > 0 && (
                    <button
                      onClick={downloadAll}
                      style={{
                        padding: '0.5rem 1rem',
                        background: 'linear-gradient(45deg, #8b5cf6, #06b6d4)',
                        border: 'none',
                        borderRadius: '8px',
                        color: 'white',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 4px 16px rgba(139, 92, 246, 0.3)'
                      }}
                    >
                      Download Tudo ({completedPhotos.length})
                    </button>
                  )}
                </div>

                <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                  {photoProgress.map((photo) => (
                    <div
                      key={photo.id}
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '12px',
                        padding: '1rem',
                        marginBottom: '1rem',
                        backdropFilter: 'blur(10px)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <h4 style={{ color: 'white', fontSize: '0.875rem', fontWeight: '500', margin: 0 }}>
                          {photo.name}
                        </h4>
                        
                        {photo.status === 'completed' && photo.enhancedUrl && (
                          <button
                            onClick={() => downloadPhoto(photo.enhancedUrl!, photo.name)}
                            style={{
                              padding: '0.25rem 0.75rem',
                              background: 'linear-gradient(45deg, #10b981, #059669)',
                              border: 'none',
                              borderRadius: '6px',
                              color: 'white',
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                              fontWeight: 'bold'
                            }}
                          >
                            Download
                          </button>
                        )}
                      </div>

                      {/* Progress Bar */}
                      <div style={{ marginBottom: '0.5rem' }}>
                        <div style={{
                          width: '100%',
                          height: '6px',
                          background: 'rgba(255, 255, 255, 0.1)',
                          borderRadius: '3px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${photo.progress}%`,
                            height: '100%',
                            background: photo.status === 'completed' 
                              ? 'linear-gradient(90deg, #10b981, #059669)'
                              : photo.status === 'error'
                              ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                              : 'linear-gradient(90deg, #8b5cf6, #06b6d4)',
                            borderRadius: '3px',
                            transition: 'width 0.3s ease'
                          }} />
                        </div>
                      </div>

                      {/* Status */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {photo.status === 'waiting' && (
                          <>
                            <div style={{ width: '8px', height: '8px', background: '#6b7280', borderRadius: '50%' }} />
                            <span style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.75rem' }}>Aguardando...</span>
                          </>
                        )}
                        
                        {photo.status === 'processing' && (
                          <>
                            <div className="spinner" style={{ width: '12px', height: '12px' }} />
                            <span style={{ color: '#8b5cf6', fontSize: '0.75rem' }}>Processando... {photo.progress}%</span>
                          </>
                        )}
                        
                        {photo.status === 'completed' && (
                          <>
                            <div style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%' }} />
                            <span style={{ color: '#10b981', fontSize: '0.75rem' }}>Concluído!</span>
                          </>
                        )}
                        
                        {photo.status === 'error' && (
                          <>
                            <div style={{ width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%' }} />
                            <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>
                              {photo.error || 'Erro ao processar'}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;