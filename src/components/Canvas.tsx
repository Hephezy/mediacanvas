import { useEffect, useRef, useCallback, useState } from 'react';
import { useMediaEditor } from '../context/useMediaEditor';

const Canvas = () => {
  const { selectedMedia, scale, rotation } = useMediaEditor();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaElementRef = useRef<HTMLImageElement | HTMLVideoElement | null>(null);

  // Resize state
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [mediaTransform, setMediaTransform] = useState({
    width: 0,
    height: 0,
    x: 0,
    y: 0
  });

  // Canvas dimensions
  const CANVAS_WIDTH = 1000;
  const CANVAS_HEIGHT = 600;

  // Draw grid helper
  const drawGrid = useCallback((ctx: CanvasRenderingContext2D) => {
    const gridSize = 20;
    ctx.save();
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 0.5;
    ctx.globalAlpha = 0.3;

    // Vertical lines
    for (let x = 0; x <= CANVAS_WIDTH; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }

    // Horizontal lines
    for (let y = 0; y <= CANVAS_HEIGHT; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_WIDTH, y);
      ctx.stroke();
    }

    ctx.restore();
  }, []);

  const drawResizeHandles = useCallback((ctx: CanvasRenderingContext2D, currentWidth: number, currentHeight: number) => {
    if (!selectedMedia) return;

    const centerX = CANVAS_WIDTH / 2;
    const centerY = CANVAS_HEIGHT / 2;

    // Use passed dimensions or current transform
    const width = currentWidth * scale;
    const height = currentHeight * scale;

    const handleSize = 8;
    const handles = [
      { id: 'nw', x: centerX - width / 2 - handleSize / 2, y: centerY - height / 2 - handleSize / 2 },
      { id: 'ne', x: centerX + width / 2 - handleSize / 2, y: centerY - height / 2 - handleSize / 2 },
      { id: 'sw', x: centerX - width / 2 - handleSize / 2, y: centerY + height / 2 - handleSize / 2 },
      { id: 'se', x: centerX + width / 2 - handleSize / 2, y: centerY + height / 2 - handleSize / 2 }
    ];

    ctx.save();
    handles.forEach(handle => {
      ctx.fillStyle = '#3b82f6';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;

      ctx.fillRect(handle.x, handle.y, handleSize, handleSize);
      ctx.strokeRect(handle.x, handle.y, handleSize, handleSize);
    });
    ctx.restore();
  }, [selectedMedia, scale]);

  const drawMedia = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const mediaElement = mediaElementRef.current;

    if (!canvas || !ctx || !mediaElement || !selectedMedia) return;

    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw grid background first
    drawGrid(ctx);

    // Save context for transformations
    ctx.save();

    // Move to center of canvas for transformations
    ctx.translate(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);

    // Apply transformations
    ctx.scale(scale, scale);
    ctx.rotate((rotation * Math.PI) / 180);

    // Get media dimensions
    let mediaWidth = 0;
    let mediaHeight = 0;

    if (selectedMedia.type === 'image') {
      const img = mediaElement as HTMLImageElement;
      mediaWidth = img.naturalWidth || img.width;
      mediaHeight = img.naturalHeight || img.height;
    } else {
      const video = mediaElement as HTMLVideoElement;
      mediaWidth = video.videoWidth || video.width;
      mediaHeight = video.videoHeight || video.height;
    }

    // Use current transform dimensions or calculate initial ones
    let drawWidth = mediaTransform.width;
    let drawHeight = mediaTransform.height;

    // Only calculate initial dimensions if not set
    if (drawWidth === 0 || drawHeight === 0) {
      const maxWidth = CANVAS_WIDTH * 0.8;
      const maxHeight = CANVAS_HEIGHT * 0.8;

      drawWidth = mediaWidth;
      drawHeight = mediaHeight;

      if (mediaWidth > maxWidth || mediaHeight > maxHeight) {
        const widthRatio = maxWidth / mediaWidth;
        const heightRatio = maxHeight / mediaHeight;
        const ratio = Math.min(widthRatio, heightRatio);

        drawWidth = mediaWidth * ratio;
        drawHeight = mediaHeight * ratio;
      }
    }

    // Draw media
    ctx.drawImage(
      mediaElement,
      mediaTransform.x || -drawWidth / 2,
      mediaTransform.y || -drawHeight / 2,
      drawWidth,
      drawHeight
    );

    // Restore context
    ctx.restore();

    // Draw resize handles if media is selected
    if (selectedMedia) {
      drawResizeHandles(ctx, drawWidth, drawHeight);
    }
  }, [selectedMedia, scale, rotation, drawGrid, mediaTransform, drawResizeHandles]);

  // Handle mouse events for resizing
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!selectedMedia || mediaTransform.width === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if clicking on resize handles
    const centerX = CANVAS_WIDTH / 2;
    const centerY = CANVAS_HEIGHT / 2;
    const width = mediaTransform.width * scale;
    const height = mediaTransform.height * scale;
    const handleSize = 8;

    const handles = [
      { id: 'nw', x: centerX - width / 2 - handleSize / 2, y: centerY - height / 2 - handleSize / 2 },
      { id: 'ne', x: centerX + width / 2 - handleSize / 2, y: centerY - height / 2 - handleSize / 2 },
      { id: 'sw', x: centerX - width / 2 - handleSize / 2, y: centerY + height / 2 - handleSize / 2 },
      { id: 'se', x: centerX + width / 2 - handleSize / 2, y: centerY + height / 2 - handleSize / 2 }
    ];

    for (const handle of handles) {
      if (x >= handle.x && x <= handle.x + handleSize &&
        y >= handle.y && y <= handle.y + handleSize) {
        setIsResizing(true);
        setResizeHandle(handle.id);
        return;
      }
    }
  }, [selectedMedia, mediaTransform, scale]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isResizing || !resizeHandle || !selectedMedia) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = CANVAS_WIDTH / 2;
    const centerY = CANVAS_HEIGHT / 2;

    // Calculate new dimensions based on handle being dragged
    let newWidth = mediaTransform.width;
    let newHeight = mediaTransform.height;

    const aspectRatio = mediaTransform.width / mediaTransform.height;

    switch (resizeHandle) {
      case 'se':
        newWidth = Math.max(50, (x - centerX + mediaTransform.width / 2) * 2 / scale);
        newHeight = newWidth / aspectRatio;
        break;
      case 'sw':
        newWidth = Math.max(50, (centerX - x + mediaTransform.width / 2) * 2 / scale);
        newHeight = newWidth / aspectRatio;
        break;
      case 'ne':
        newWidth = Math.max(50, (x - centerX + mediaTransform.width / 2) * 2 / scale);
        newHeight = newWidth / aspectRatio;
        break;
      case 'nw':
        newWidth = Math.max(50, (centerX - x + mediaTransform.width / 2) * 2 / scale);
        newHeight = newWidth / aspectRatio;
        break;
    }

    setMediaTransform(prev => ({
      ...prev,
      width: newWidth,
      height: newHeight,
      x: -newWidth / 2,
      y: -newHeight / 2
    }));
  }, [isResizing, resizeHandle, selectedMedia, mediaTransform, scale]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    setResizeHandle(null);
  }, []);

  // Load and draw media when selected media changes
  useEffect(() => {
    if (!selectedMedia) {
      // Clear canvas when no media selected
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx) {
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        drawGrid(ctx);
      }
      setMediaTransform({ width: 0, height: 0, x: 0, y: 0 });
      return;
    }

    // Create media element
    if (selectedMedia.type === 'image') {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        mediaElementRef.current = img;

        // Calculate initial dimensions
        const maxWidth = CANVAS_WIDTH * 0.8;
        const maxHeight = CANVAS_HEIGHT * 0.8;
        let drawWidth = img.naturalWidth || img.width;
        let drawHeight = img.naturalHeight || img.height;

        if (drawWidth > maxWidth || drawHeight > maxHeight) {
          const widthRatio = maxWidth / drawWidth;
          const heightRatio = maxHeight / drawHeight;
          const ratio = Math.min(widthRatio, heightRatio);
          drawWidth = drawWidth * ratio;
          drawHeight = drawHeight * ratio;
        }

        setMediaTransform({
          width: drawWidth,
          height: drawHeight,
          x: -drawWidth / 2,
          y: -drawHeight / 2
        });
      };
      img.onerror = (error) => {
        console.error('Error loading image:', error);
      };
      img.src = selectedMedia.url;
    } else {
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.muted = true;
      video.preload = 'metadata';

      video.onloadedmetadata = () => {
        // Set video to first frame
        video.currentTime = 0.1;
      };

      video.onloadeddata = () => {
        mediaElementRef.current = video;

        // Calculate initial dimensions
        const maxWidth = CANVAS_WIDTH * 0.8;
        const maxHeight = CANVAS_HEIGHT * 0.8;
        let drawWidth = video.videoWidth || video.width;
        let drawHeight = video.videoHeight || video.height;

        if (drawWidth > maxWidth || drawHeight > maxHeight) {
          const widthRatio = maxWidth / drawWidth;
          const heightRatio = maxHeight / drawHeight;
          const ratio = Math.min(widthRatio, heightRatio);
          drawWidth = drawWidth * ratio;
          drawHeight = drawHeight * ratio;
        }

        setMediaTransform({
          width: drawWidth,
          height: drawHeight,
          x: -drawWidth / 2,
          y: -drawHeight / 2
        });
      };

      video.onerror = (error) => {
        console.error('Error loading video:', error);
      };

      video.src = selectedMedia.url;
    }
  }, [selectedMedia, drawGrid]);

  // Redraw when transformations change (only when we have valid transform data)
  useEffect(() => {
    if (selectedMedia && mediaElementRef.current && mediaTransform.width > 0) {
      drawMedia();
    }
  }, [scale, rotation, drawMedia, selectedMedia, mediaTransform]);

  // Handle canvas resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = CANVAS_WIDTH;
      canvas.height = CANVAS_HEIGHT;

      // Initial grid draw
      const ctx = canvas.getContext('2d');
      if (ctx) {
        drawGrid(ctx);
      }
    }
  }, [drawGrid]);

  // Export canvas as image
  const exportCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create a temporary canvas without resize handles
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    tempCanvas.width = CANVAS_WIDTH;
    tempCanvas.height = CANVAS_HEIGHT;

    // Draw everything except resize handles
    const mediaElement = mediaElementRef.current;
    if (mediaElement && selectedMedia) {
      // Clear canvas
      tempCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Draw grid background
      drawGrid(tempCtx);

      // Save context for transformations
      tempCtx.save();

      // Move to center of canvas for transformations
      tempCtx.translate(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);

      // Apply transformations
      tempCtx.scale(scale, scale);
      tempCtx.rotate((rotation * Math.PI) / 180);

      // Draw media
      tempCtx.drawImage(
        mediaElement,
        mediaTransform.x || -mediaTransform.width / 2,
        mediaTransform.y || -mediaTransform.height / 2,
        mediaTransform.width,
        mediaTransform.height
      );

      // Restore context
      tempCtx.restore();
    }

    const link = document.createElement('a');
    const filename = selectedMedia ?
      `edited-${selectedMedia.name.split('.')[0]}.png` :
      'canvas-export.png';

    link.download = filename;
    link.href = tempCanvas.toDataURL('image/png');
    link.click();
  }, [selectedMedia, scale, rotation, mediaTransform, drawGrid]);

  return (
    <div className="flex-1 relative overflow-hidden bg-gray-900 flex flex-col items-center justify-center p-4">
      {/* Canvas */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          className={`border-2 border-gray-600 bg-white shadow-lg ${isResizing ? 'cursor-nw-resize' : 'cursor-crosshair'
            }`}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />

        {/* Canvas overlay info */}
        {selectedMedia && (
          <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-2 rounded-lg text-sm">
            <div className="font-medium">{selectedMedia.name}</div>
            <div className="text-xs text-gray-300">
              {selectedMedia.type} • Scale: {Math.round(scale * 100)}% • Rotation: {rotation}°
              {mediaTransform.width > 0 && (
                <> • Size: {Math.round(mediaTransform.width)}×{Math.round(mediaTransform.height)}</>
              )}
            </div>
          </div>
        )}

        {/* Export button */}
        {selectedMedia && (
          <button
            onClick={exportCanvas}
            className="absolute top-4 right-4 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg"
            title="Export canvas as PNG"
          >
            Export
          </button>
        )}
      </div>

      {/* Empty state */}
      {!selectedMedia && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center p-8">
            <div className="text-gray-400 text-xl mb-2">No media selected</div>
            <div className="text-gray-500 text-sm">
              Upload files from the sidebar to get started
            </div>
          </div>
        </div>
      )}

      {/* Canvas info bar */}
      <div className="mt-4 text-center text-gray-400 text-sm">
        Canvas: {CANVAS_WIDTH} × {CANVAS_HEIGHT}px
        {selectedMedia && (
          <span className="ml-4">
            • Media: {selectedMedia.type}
            • Transforms: {Math.round(scale * 100)}% scale, {rotation}° rotation
            {mediaTransform.width > 0 && (
              <> • Custom size: {Math.round(mediaTransform.width)}×{Math.round(mediaTransform.height)}</>
            )}
          </span>
        )}
      </div>

      {/* Instructions */}
      {selectedMedia && (
        <div className="mt-2 text-center text-gray-500 text-xs">
          Drag the blue squares to resize • Use sidebar controls for scale and rotation
        </div>
      )}
    </div>
  );
};

export default Canvas;