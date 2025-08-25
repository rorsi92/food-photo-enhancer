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

  return React.createElement('div', { style: { padding: '20px', maxWidth: '800px', margin: '0 auto' } },
    React.createElement('h1', null, '🍔 Food Photo Enhancer'),
    React.createElement('p', null, 'AI-powered food photo enhancement using GPT-4o + Sharp'),
    
    React.createElement('div', { style: { marginBottom: '20px' } },
      React.createElement('input', {
        type: 'file',
        accept: 'image/*',
        onChange: handleFileSelect,
        style: { marginBottom: '10px' }
      }),
      
      selectedFile && React.createElement('div', null,
        React.createElement('p', null, 'Selected: ' + selectedFile.name),
        React.createElement('button', {
          onClick: handleEnhance,
          disabled: isProcessing,
          style: {
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: isProcessing ? 'not-allowed' : 'pointer'
          }
        }, isProcessing ? '🔄 Processing...' : '✨ Enhance Photo')
      )
    ),

    selectedFile && React.createElement('div', { style: { marginBottom: '20px' } },
      React.createElement('h3', null, 'Original Photo:'),
      React.createElement('img', {
        src: URL.createObjectURL(selectedFile),
        alt: 'Original',
        style: { maxWidth: '100%', height: 'auto', border: '1px solid #ddd' }
      })
    ),

    enhancedImage && React.createElement('div', { style: { marginBottom: '20px' } },
      React.createElement('h3', null, 'Enhanced Photo:'),
      React.createElement('img', {
        src: enhancedImage,
        alt: 'Enhanced',
        style: { maxWidth: '100%', height: 'auto', border: '1px solid #ddd' }
      })
    ),

    result && React.createElement('div', { style: { marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px' } },
      React.createElement('h3', null, 'Enhancement Result:'),
      React.createElement('p', null, React.createElement('strong', null, 'Food Type: '), result.analysis?.produto),
      React.createElement('p', null, React.createElement('strong', null, 'Method: '), result.analysis?.metodo),
      React.createElement('p', null, React.createElement('strong', null, 'Status: '), result.success ? '✅ Success' : '❌ Failed')
    )
  );
}

export default App;