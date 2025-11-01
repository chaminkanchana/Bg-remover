
import React, { useState, useCallback, useMemo } from 'react';
import { removeBackground } from './services/geminiService';

// --- Helper Functions ---
const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const getFileExtension = (filename: string) => {
  return filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2);
};

// --- SVG Icon Components ---
const UploadIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
  </svg>
);

const DownloadIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
  </svg>
);

const MagicWandIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.998 15.998 0 011.622-3.385m5.043.025a2.25 2.25 0 012.245 2.4c.398.078.78.22 1.128.22a4.5 4.5 0 00-2.245-8.4m-8.4 2.245a3 3 0 001.128-5.78m-1.128 5.78a2.25 2.25 0 00-2.4 2.245c-.398-.078-.78-.22-1.128-.22a4.5 4.5 0 012.245-8.4" />
  </svg>
);


// --- UI Components (Defined outside App to prevent re-renders) ---
interface ImageUploaderProps {
  onImageUpload: (file: File) => void;
  disabled: boolean;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, disabled }) => {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      onImageUpload(event.target.files[0]);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      onImageUpload(event.dataTransfer.files[0]);
    }
  };

  return (
    <label
      htmlFor="image-upload"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-300 ease-in-out
        ${disabled ? 'border-base-300 bg-base-200 cursor-not-allowed' : 'border-brand-secondary bg-base-200 hover:bg-base-300 hover:border-brand-light'}`}
    >
      <div className="flex flex-col items-center justify-center pt-5 pb-6">
        <UploadIcon className={`w-10 h-10 mb-3 ${disabled ? 'text-gray-500' : 'text-brand-light'}`} />
        <p className={`mb-2 text-sm ${disabled ? 'text-gray-500' : 'text-gray-400'}`}>
          <span className="font-semibold">Click to upload</span> or drag and drop
        </p>
        <p className={`text-xs ${disabled ? 'text-gray-600' : 'text-gray-500'}`}>PNG, JPG, GIF up to 10MB</p>
      </div>
      <input
        id="image-upload"
        type="file"
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
        disabled={disabled}
      />
    </label>
  );
};

interface ImageDisplayProps {
  title: string;
  imageUrl: string | null;
}

const ImageDisplay: React.FC<ImageDisplayProps> = ({ title, imageUrl }) => (
  <div className="w-full flex flex-col items-center">
    <h3 className="text-lg font-semibold text-gray-200 mb-2">{title}</h3>
    <div className="w-full h-80 bg-base-200 rounded-lg flex items-center justify-center overflow-hidden border border-base-300 shadow-lg"
      style={{
        backgroundImage: `
          linear-gradient(45deg, #374151 25%, transparent 25%), 
          linear-gradient(-45deg, #374151 25%, transparent 25%),
          linear-gradient(45deg, transparent 75%, #374151 75%),
          linear-gradient(-45deg, transparent 75%, #374151 75%)`,
        backgroundSize: '20px 20px',
        backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
      }}
    >
      {imageUrl ? (
        <img src={imageUrl} alt={title} className="max-w-full max-h-full object-contain" />
      ) : (
        <span className="text-gray-500">Your image will appear here</span>
      )}
    </div>
  </div>
);

interface ActionButtonProps {
  onClick: () => void;
  disabled: boolean;
  children: React.ReactNode;
  className?: string;
}

const ActionButton: React.FC<ActionButtonProps> = ({ onClick, disabled, children, className }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-base-100
      ${className}
      ${disabled ? 'bg-base-300 text-gray-400 cursor-not-allowed' : 'hover:scale-105'}`}
  >
    {children}
  </button>
);


const Spinner: React.FC = () => (
  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
);

// --- Main App Component ---
export default function App() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = useCallback(async (file: File) => {
    setError(null);
    setProcessedImage(null);
    setOriginalFile(file);
    try {
      const dataUrl = await fileToDataUrl(file);
      setOriginalImage(dataUrl);
    } catch (err) {
      setError('Failed to read the image file.');
      console.error(err);
    }
  }, []);

  const handleRemoveBackground = useCallback(async () => {
    if (!originalImage || !originalFile) {
      setError('Please upload an image first.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setProcessedImage(null);

    try {
      const { base64, mimeType } = {
        base64: originalImage.split(',')[1],
        mimeType: originalFile.type
      };

      const resultBase64 = await removeBackground(base64, mimeType);
      
      // The API often returns PNG for transparency. We should reflect that.
      const resultMimeType = resultBase64.startsWith('data:image/png') ? 'image/png' : 'image/jpeg';
      
      setProcessedImage(`data:${resultMimeType};base64,${resultBase64}`);
    } catch (err) {
      console.error('Error removing background:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to remove background. ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [originalImage, originalFile]);

  const handleDownload = useCallback(() => {
    if (!processedImage || !originalFile) return;

    const link = document.createElement('a');
    link.href = processedImage;
    const name = originalFile.name;
    const extension = getFileExtension(name);
    const newName = name.replace(`.${extension}`, '') + '-no-bg.png';
    link.download = newName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [processedImage, originalFile]);
  
  const canProcess = useMemo(() => originalImage && !isLoading, [originalImage, isLoading]);
  const canDownload = useMemo(() => processedImage && !isLoading, [processedImage, isLoading]);


  return (
    <div className="min-h-screen bg-base-100 text-white font-sans">
      <main className="container mx-auto px-4 py-8 md:py-12">
        <header className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-brand-light to-brand-secondary">
            AI Background Remover
          </h1>
          <p className="mt-4 text-lg text-gray-300 max-w-2xl mx-auto">
            Upload an image and let Gemini API's magic instantly remove the background for you.
          </p>
        </header>

        <div className="max-w-xl mx-auto mb-8">
            <ImageUploader onImageUpload={handleImageUpload} disabled={isLoading} />
        </div>

        {error && (
            <div className="bg-red-800/50 border border-red-600 text-red-200 px-4 py-3 rounded-lg relative text-center max-w-3xl mx-auto mb-6" role="alert">
                <strong className="font-bold">Oops! </strong>
                <span className="block sm:inline">{error}</span>
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-8">
          <ImageDisplay title="Original Image" imageUrl={originalImage} />
          <ImageDisplay title="Background Removed" imageUrl={processedImage} />
        </div>

        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-8">
           <ActionButton
              onClick={handleRemoveBackground}
              disabled={!canProcess}
              className="bg-brand-primary hover:bg-blue-800 w-full sm:w-auto"
            >
              {isLoading ? (
                <>
                  <Spinner />
                  <span className="ml-2">Processing...</span>
                </>
              ) : (
                <>
                  <MagicWandIcon className="w-5 h-5 mr-2" />
                  Remove Background
                </>
              )}
            </ActionButton>
            
            <ActionButton
              onClick={handleDownload}
              disabled={!canDownload}
              className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
            >
              <DownloadIcon className="w-5 h-5 mr-2" />
              Download Image
            </ActionButton>
        </div>
      </main>
      <footer className="text-center py-6 text-gray-500 text-sm">
        <p>Powered by Google Gemini API</p>
      </footer>
    </div>
  );
}
