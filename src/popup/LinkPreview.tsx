import React, { useState, useEffect, useRef } from 'react';

interface LinkPreviewProps {
  url: string | null;
  position: { x: number; y: number } | null;
}

const LinkPreview: React.FC<LinkPreviewProps> = ({ url, position }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!url || !position) {
      return;
    }

    setLoading(true);
    setError(null);

    // Position the preview container
    if (previewRef.current) {
      const rect = previewRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Calculate position to ensure preview stays within viewport
      let x = position.x + 20; // Offset from cursor
      let y = position.y + 10;
      
      // Adjust if would go off right edge
      if (x + rect.width > viewportWidth) {
        x = Math.max(0, viewportWidth - rect.width);
      }
      
      // Adjust if would go off bottom edge
      if (y + rect.height > viewportHeight) {
        y = Math.max(0, viewportHeight - rect.height);
      }
      
      previewRef.current.style.left = `${x}px`;
      previewRef.current.style.top = `${y}px`;
    }

    // Handle iframe load events
    const handleLoad = () => {
      setLoading(false);
    };

    const handleError = () => {
      setLoading(false);
      setError('Не удалось загрузить предпросмотр');
    };

    if (iframeRef.current) {
      iframeRef.current.addEventListener('load', handleLoad);
      iframeRef.current.addEventListener('error', handleError);
    }

    return () => {
      if (iframeRef.current) {
        iframeRef.current.removeEventListener('load', handleLoad);
        iframeRef.current.removeEventListener('error', handleError);
      }
    };
  }, [url, position]);

  if (!url || !position) {
    return null;
  }

  return (
    <div 
      ref={previewRef} 
      className={`link-preview-container ${url ? 'visible' : ''}`}
    >
      {loading && (
        <div className="link-preview-loading">
          Загрузка предпросмотра...
        </div>
      )}
      
      {error && (
        <div className="link-preview-error">
          {error}
        </div>
      )}
      
      <iframe
        ref={iframeRef}
        src={url}
        className="link-preview-iframe"
        title="Link Preview"
        sandbox="allow-same-origin"
        style={{ display: loading || error ? 'none' : 'block' }}
      />
    </div>
  );
};

export default LinkPreview;