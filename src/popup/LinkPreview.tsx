import React, { useState, useEffect } from 'react';

type LinkPreviewProps = {
  url: string;
  visible: boolean;
  position: { x: number, y: number };
};

const LinkPreview: React.FC<LinkPreviewProps> = ({ url, visible, position }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!visible || !url) return;

    setLoading(true);
    
    // Generate preview URL using a screenshot service
    // Using s.wordpress.com as it's a reliable and free screenshot service
    const screenshotUrl = `https://s.wordpress.com/mshots/v1/${encodeURIComponent(url)}?w=320&h=240`;
    
    // Create an image element to check if the screenshot is loaded
    const img = new Image();
    img.onload = () => {
      setPreviewUrl(screenshotUrl);
      setLoading(false);
    };
    img.onerror = () => {
      // Fallback to favicon if screenshot fails
      const faviconUrl = `https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(url)}&sz=64`;
      setPreviewUrl(faviconUrl);
      setLoading(false);
    };
    img.src = screenshotUrl;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [url, visible]);

  if (!visible) return null;

  return (
    <div 
      className="link-preview-container" 
      style={{ 
        left: `${position.x + 20}px`, 
        top: `${position.y}px` 
      }}
    >
      {loading ? (
        <div className="preview-loading">Loading preview...</div>
      ) : error ? (
        <div className="preview-error">{error}</div>
      ) : (
        <div className="preview-content">
          <div className="preview-image">
            {previewUrl && <img src={previewUrl} alt="Site preview" />}
          </div>
          <div className="preview-url">{url}</div>
        </div>
      )}
    </div>
  );
};

export default LinkPreview;