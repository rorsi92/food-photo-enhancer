import React, { useState } from 'react';

function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [enhancedImage, setEnhancedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setEnhancedImage(null);
      setResult(null);
    }
  };

  const handleEnhance = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    const formData = new FormData();
    formData.append('photo', selectedFile);

    try {
      const response = await fetch('/api/enhance/single', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data);
        if (data.enhancedUrl) {
          setEnhancedImage(data.enhancedUrl);
        }
      } else {
        console.error('Enhancement failed');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>🍔 Food Photo Enhancer</h1>
      <p>AI-powered food photo enhancement using GPT-4o + Sharp</p>
      
      <div style={{ marginBottom: '20px' }}>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          style={{ marginBottom: '10px' }}
        />
        
        {selectedFile && (
          <div>
            <p>Selected: {selectedFile.name}</p>
            <button 
              onClick={handleEnhance}
              disabled={isProcessing}
              style={{
                padding: '10px 20px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: isProcessing ? 'not-allowed' : 'pointer'
              }}
            >
              {isProcessing ? '🔄 Processing...' : '✨ Enhance Photo'}
            </button>
          </div>
        )}
      </div>

      {selectedFile && (
        <div style={{ marginBottom: '20px' }}>
          <h3>Original Photo:</h3>
          <img 
            src={URL.createObjectURL(selectedFile)} 
            alt="Original"
            style={{ maxWidth: '100%', height: 'auto', border: '1px solid #ddd' }}
          />
        </div>
      )}

      {enhancedImage && (
        <div style={{ marginBottom: '20px' }}>
          <h3>Enhanced Photo:</h3>
          <img 
            src={enhancedImage} 
            alt="Enhanced"
            style={{ maxWidth: '100%', height: 'auto', border: '1px solid #ddd' }}
          />
        </div>
      )}

      {result && (
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
          <h3>Enhancement Result:</h3>
          <p><strong>Food Type:</strong> {result.analysis?.produto}</p>
          <p><strong>Method:</strong> {result.analysis?.metodo}</p>
          <p><strong>Status:</strong> {result.success ? '✅ Success' : '❌ Failed'}</p>
        </div>
      )}
    </div>
  );
}

export default App;