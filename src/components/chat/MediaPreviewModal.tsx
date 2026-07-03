import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface MediaPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaUrl: string;
  mediaType: 'image' | 'video' | 'file';
  fileName?: string;
}

export const MediaPreviewModal: React.FC<MediaPreviewModalProps> = ({ isOpen, onClose, mediaUrl, mediaType, fileName }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.5, 5));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.5, 0.5));

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (mediaType === 'image') {
        if (e.key === '+' || e.key === '=') handleZoomIn();
        if (e.key === '-') handleZoomOut();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKey);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose, mediaType]);

  if (!isOpen) return null;

  const handleDownload = async () => {
    try {
      const response = await fetch(mediaUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed', error);
      // Fallback
      window.open(mediaUrl, '_blank');
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (scale <= 1) return;
    setIsDragging(true);
    setStartPos({ x: e.clientX - position.x, y: e.clientY - position.y });
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - startPos.x,
      y: e.clientY - startPos.y
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (mediaType !== 'image') return;
    if (e.deltaY < 0) handleZoomIn();
    else handleZoomOut();
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fade-in" onClick={onClose} onWheel={handleWheel}>
      <div className="absolute top-4 right-4 flex items-center gap-3 z-50">
        {mediaType === 'image' && (
          <>
            <button onClick={(e) => { e.stopPropagation(); handleZoomIn(); }} className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors border border-white/10" title="Phóng to (+)">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
            </button>
            <button onClick={(e) => { e.stopPropagation(); handleZoomOut(); }} className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors border border-white/10" title="Thu nhỏ (-)">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" /></svg>
            </button>
          </>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); handleDownload(); }}
          className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors group relative border border-white/10"
          title="Tải xuống"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[11px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Tải xuống</span>
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); window.open(mediaUrl, '_blank'); }}
          className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors group relative border border-white/10"
          title="Mở trong thẻ mới"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
          <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[11px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Mở thẻ mới</span>
        </button>
        <button
          onClick={onClose}
          className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors border border-white/10"
          title="Đóng"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="max-w-[90vw] max-h-[90vh] flex items-center justify-center overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {mediaType === 'image' ? (
          <img 
            src={mediaUrl} 
            alt={fileName || 'Media'} 
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl touch-none" 
            style={{ 
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
              transition: isDragging ? 'none' : 'transform 0.2s ease-out'
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          />
        ) : mediaType === 'video' ? (
          <video src={mediaUrl} controls autoPlay className="max-w-full max-h-[90vh] rounded-lg shadow-2xl" />
        ) : (
          <iframe src={`https://docs.google.com/gview?url=${encodeURIComponent(mediaUrl)}&embedded=true`} className="w-[85vw] h-[90vh] rounded-lg shadow-2xl bg-white border-none" title={fileName} />
        )}
      </div>
      
      {fileName && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full text-sm backdrop-blur-md">
          {fileName}
        </div>
      )}
    </div>,
    document.body
  );
};
