import { useEffect, useRef, useCallback, useState } from 'react';
import { useMediaEditor } from '../context/useMediaEditor';
import type { CanvasMediaItem } from '../../types/index';

const Canvas = () => {
  const {
    canvasItems,
    selectCanvasItem,
    updateCanvasItemTransform,
    selectedCanvasItem
  } = useMediaEditor();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaElementsRef = useRef<Map<string, HTMLImageElement | HTMLVideoElement>>(new Map());

  // Interaction state
  const [isResizing, setIsResizing] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [resizeStart, setResizeStart] = useState<{
    mouseX: number;
    mouseY: number;
    width: number;
    height: number;
    scale: number;
    centerX: number;
    centerY: number;
  } | null>(null);
  const [rotationStart, setRotationStart] = useState<{
    mouseX: number;
    mouseY: number;
    rotation: number;
    centerX: number;
    centerY: number;
  } | null>(null);

  // Canvas dimensions
  const CANVAS_WIDTH = 1000;
  const CANVAS_HEIGHT = 550;

  // Utility functions for coordinate transformations
  const getTransformedBounds = useCallback((item: CanvasMediaItem) => {
    const { x, y, width, height, scale, rotation } = item.transform;

    // Scale the dimensions
    const scaledWidth = width * scale;
    const scaledHeight = height * scale;

    // Convert rotation to radians
    const rad = (rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    // Calculate corners of rotated rectangle
    const hw = scaledWidth / 2;
    const hh = scaledHeight / 2;

    const corners = [
      { x: -hw, y: -hh },
      { x: hw, y: -hh },
      { x: hw, y: hh },
      { x: -hw, y: hh }
    ];

    // Apply rotation and translation
    const rotatedCorners = corners.map(corner => ({
      x: CANVAS_WIDTH / 2 + x + (corner.x * cos - corner.y * sin),
      y: CANVAS_HEIGHT / 2 + y + (corner.x * sin + corner.y * cos)
    }));

    // Find bounding box
    const minX = Math.min(...rotatedCorners.map(c => c.x));
    const maxX = Math.max(...rotatedCorners.map(c => c.x));
    const minY = Math.min(...rotatedCorners.map(c => c.y));
    const maxY = Math.max(...rotatedCorners.map(c => c.y));

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
      corners: rotatedCorners,
      center: {
        x: CANVAS_WIDTH / 2 + x,
        y: CANVAS_HEIGHT / 2 + y
      }
    };
  }, []);

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

  // Draw rotated bounding box
  const drawBoundingBox = useCallback((ctx: CanvasRenderingContext2D, item: CanvasMediaItem) => {
    const bounds = getTransformedBounds(item);

    ctx.save();
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.globalAlpha = 0.8;

    // Draw rotated bounding box using corners
    ctx.beginPath();
    ctx.moveTo(bounds.corners[0].x, bounds.corners[0].y);
    for (let i = 1; i < bounds.corners.length; i++) {
      ctx.lineTo(bounds.corners[i].x, bounds.corners[i].y);
    }
    ctx.closePath();
    ctx.stroke();

    ctx.restore();
  }, [getTransformedBounds]);

  // Draw resize handles and rotation handle
  const drawHandles = useCallback((ctx: CanvasRenderingContext2D, item: CanvasMediaItem) => {
    const bounds = getTransformedBounds(item);
    const handleSize = 12;

    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    // Draw resize handles at rotated corners
    bounds.corners.forEach((corner) => {
      // Outer circle
      ctx.beginPath();
      ctx.arc(corner.x, corner.y, handleSize / 2 + 1, 0, 2 * Math.PI);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Inner circle
      ctx.beginPath();
      ctx.arc(corner.x, corner.y, handleSize / 2 - 2, 0, 2 * Math.PI);
      ctx.fillStyle = '#3b82f6';
      ctx.fill();
    });

    // Draw rotation handle - positioned above the top center
    const topCenter = {
      x: (bounds.corners[0].x + bounds.corners[1].x) / 2,
      y: (bounds.corners[0].y + bounds.corners[1].y) / 2
    };

    // Calculate direction vector for rotation handle placement
    const dx = bounds.corners[1].x - bounds.corners[0].x;
    const dy = bounds.corners[1].y - bounds.corners[0].y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const normalX = -dy / length; // Perpendicular to top edge
    const normalY = dx / length;

    const rotationHandleDistance = 30;
    const rotationHandle = {
      x: topCenter.x + normalX * rotationHandleDistance,
      y: topCenter.y + normalY * rotationHandleDistance
    };

    // Draw line from top center to rotation handle
    ctx.beginPath();
    ctx.moveTo(topCenter.x, topCenter.y);
    ctx.lineTo(rotationHandle.x, rotationHandle.y);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw rotation handle (circular with rotation icon)
    ctx.beginPath();
    ctx.arc(rotationHandle.x, rotationHandle.y, handleSize / 2 + 2, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(rotationHandle.x, rotationHandle.y, handleSize / 2 - 1, 0, 2 * Math.PI);
    ctx.fillStyle = '#f59e0b';
    ctx.fill();

    // Draw small rotation arrows in the handle
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    const arrowSize = 3;

    // Left arrow
    ctx.beginPath();
    ctx.arc(rotationHandle.x - 2, rotationHandle.y, arrowSize, Math.PI * 0.7, Math.PI * 1.3);
    ctx.stroke();

    // Right arrow
    ctx.beginPath();
    ctx.arc(rotationHandle.x + 2, rotationHandle.y, arrowSize, Math.PI * 1.7, Math.PI * 0.3);
    ctx.stroke();

    ctx.restore();
  }, [getTransformedBounds]);

  // Draw single media item
  const drawMediaItem = useCallback((ctx: CanvasRenderingContext2D, item: CanvasMediaItem) => {
    const mediaElement = mediaElementsRef.current.get(item.id);
    if (!mediaElement) return;

    const { x, y, width, height, scale, rotation } = item.transform;

    ctx.save();

    // Move to center and apply transformations
    ctx.translate(CANVAS_WIDTH / 2 + x, CANVAS_HEIGHT / 2 + y);
    ctx.scale(scale, scale);
    ctx.rotate((rotation * Math.PI) / 180);

    // Draw media
    ctx.drawImage(
      mediaElement,
      -width / 2,
      -height / 2,
      width,
      height
    );

    ctx.restore();
  }, []);

  // Main draw function
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw grid background
    drawGrid(ctx);

    // Sort items by z-index and draw them
    const sortedItems = [...canvasItems].sort((a, b) => a.transform.zIndex - b.transform.zIndex);

    sortedItems.forEach(item => {
      drawMediaItem(ctx, item);
    });

    // Draw bounding box and handles for selected item
    if (selectedCanvasItem) {
      drawBoundingBox(ctx, selectedCanvasItem);
      drawHandles(ctx, selectedCanvasItem);
    }
  }, [canvasItems, selectedCanvasItem, drawGrid, drawMediaItem, drawBoundingBox, drawHandles]);

  // Check if point is inside item bounds
  const getItemAtPoint = useCallback((x: number, y: number): CanvasMediaItem | null => {
    const sortedItems = [...canvasItems].sort((a, b) => b.transform.zIndex - a.transform.zIndex);

    for (const item of sortedItems) {
      const bounds = getTransformedBounds(item);

      if (x >= bounds.x && x <= bounds.x + bounds.width &&
        y >= bounds.y && y <= bounds.y + bounds.height) {
        return item;
      }
    }

    return null;
  }, [canvasItems, getTransformedBounds]);

  // Check if point is on resize handle
  const getResizeHandle = useCallback((x: number, y: number, item: CanvasMediaItem): string | null => {
    const bounds = getTransformedBounds(item);
    const handleSize = 10;
    const tolerance = 8;

    const handles = [
      { id: 'nw', corner: bounds.corners[0] },
      { id: 'ne', corner: bounds.corners[1] },
      { id: 'se', corner: bounds.corners[2] },
      { id: 'sw', corner: bounds.corners[3] }
    ];

    for (const handle of handles) {
      const dx = x - handle.corner.x;
      const dy = y - handle.corner.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= (handleSize / 2 + tolerance)) {
        return handle.id;
      }
    }

    return null;
  }, [getTransformedBounds]);

  // Check if point is on rotation handle
  const getRotationHandle = useCallback((x: number, y: number, item: CanvasMediaItem): boolean => {
    const bounds = getTransformedBounds(item);
    const handleSize = 12;
    const tolerance = 8;

    // Calculate rotation handle position
    const topCenter = {
      x: (bounds.corners[0].x + bounds.corners[1].x) / 2,
      y: (bounds.corners[0].y + bounds.corners[1].y) / 2
    };

    const dx = bounds.corners[1].x - bounds.corners[0].x;
    const dy = bounds.corners[1].y - bounds.corners[0].y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const normalX = -dy / length;
    const normalY = dx / length;

    const rotationHandleDistance = 30;
    const rotationHandle = {
      x: topCenter.x + normalX * rotationHandleDistance,
      y: topCenter.y + normalY * rotationHandleDistance
    };

    const distance = Math.sqrt((x - rotationHandle.x) ** 2 + (y - rotationHandle.y) ** 2);
    return distance <= (handleSize / 2 + tolerance);
  }, [getTransformedBounds]);

  // Global mouse event handlers for continuous interaction
  const handleGlobalMouseMove = useCallback((e: MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas || !selectedCanvasItem) return;

    const rect = canvas.getBoundingClientRect();
    // Don't clamp coordinates - allow them to go beyond canvas bounds
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (isResizing && resizeHandle && resizeStart) {
      const centerX = resizeStart.centerX;
      const centerY = resizeStart.centerY;

      const currentDistanceFromCenter = Math.sqrt(
        (mouseX - centerX) ** 2 + (mouseY - centerY) ** 2
      );

      const originalCornerDistance = Math.sqrt(
        (resizeStart.width / 2) ** 2 + (resizeStart.height / 2) ** 2
      ) * resizeStart.scale;

      const newScale = Math.max(0.1, Math.min(5, currentDistanceFromCenter / originalCornerDistance * resizeStart.scale));

      updateCanvasItemTransform(selectedCanvasItem.id, {
        scale: newScale
      });
    } else if (isRotating && rotationStart && selectedCanvasItem) {
      const centerX = rotationStart.centerX;
      const centerY = rotationStart.centerY;

      // Calculate angle from center to current mouse position
      const currentAngle = Math.atan2(mouseY - centerY, mouseX - centerX) * 180 / Math.PI;

      // Calculate angle from center to initial mouse position
      const initialAngle = Math.atan2(rotationStart.mouseY - centerY, rotationStart.mouseX - centerX) * 180 / Math.PI;

      // Calculate rotation delta
      let deltaRotation = currentAngle - initialAngle;

      // Normalize angle to [-180, 180]
      while (deltaRotation > 180) deltaRotation -= 360;
      while (deltaRotation < -180) deltaRotation += 360;

      const newRotation = (rotationStart.rotation + deltaRotation) % 360;

      updateCanvasItemTransform(selectedCanvasItem.id, {
        rotation: newRotation
      });
    } else if (isDragging && dragStart) {
      const deltaX = mouseX - dragStart.x;
      const deltaY = mouseY - dragStart.y;

      updateCanvasItemTransform(selectedCanvasItem.id, {
        x: selectedCanvasItem.transform.x + deltaX,
        y: selectedCanvasItem.transform.y + deltaY
      });

      setDragStart({ x: mouseX, y: mouseY });
    }
  }, [selectedCanvasItem, isResizing, isRotating, isDragging, resizeHandle, dragStart, resizeStart, rotationStart, updateCanvasItemTransform]);

  const handleGlobalMouseUp = useCallback(() => {
    setIsResizing(false);
    setIsRotating(false);
    setIsDragging(false);
    setResizeHandle(null);
    setDragStart(null);
    setResizeStart(null);
    setRotationStart(null);

    // Reset cursor will be handled by useEffect cleanup
  }, []);

  // Mouse event handlers
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (selectedCanvasItem) {
      // Check for rotation handle first
      if (getRotationHandle(x, y, selectedCanvasItem)) {
        setIsRotating(true);
        const bounds = getTransformedBounds(selectedCanvasItem);
        setRotationStart({
          mouseX: x,
          mouseY: y,
          rotation: selectedCanvasItem.transform.rotation,
          centerX: bounds.center.x,
          centerY: bounds.center.y
        });
        e.preventDefault();
        return;
      }

      // Check for resize handles
      const handle = getResizeHandle(x, y, selectedCanvasItem);
      if (handle) {
        setIsResizing(true);
        setResizeHandle(handle);

        const bounds = getTransformedBounds(selectedCanvasItem);
        setResizeStart({
          mouseX: x,
          mouseY: y,
          width: selectedCanvasItem.transform.width,
          height: selectedCanvasItem.transform.height,
          scale: selectedCanvasItem.transform.scale,
          centerX: bounds.center.x,
          centerY: bounds.center.y
        });

        e.preventDefault();
        return;
      }
    }

    // Check for item selection
    const clickedItem = getItemAtPoint(x, y);
    if (clickedItem) {
      selectCanvasItem(clickedItem.id);

      // Start dragging
      setIsDragging(true);
      setDragStart({ x, y });
      e.preventDefault();
      return;
    }

    // Click on empty space - deselect
    selectCanvasItem('');
  }, [selectedCanvasItem, getRotationHandle, getResizeHandle, getItemAtPoint, selectCanvasItem, getTransformedBounds]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !selectedCanvasItem) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Update cursor based on what's under mouse
    if (!isResizing && !isRotating && !isDragging) {
      if (getRotationHandle(mouseX, mouseY, selectedCanvasItem)) {
        canvas.style.cursor = 'grab';
      } else if (getResizeHandle(mouseX, mouseY, selectedCanvasItem)) {
        canvas.style.cursor = 'nw-resize';
      } else if (getItemAtPoint(mouseX, mouseY)) {
        canvas.style.cursor = 'move';
      } else {
        canvas.style.cursor = 'default';
      }
    }
  }, [selectedCanvasItem, isResizing, isRotating, isDragging, getRotationHandle, getResizeHandle, getItemAtPoint]);

  // Load media elements
  useEffect(() => {
    canvasItems.forEach(item => {
      if (!mediaElementsRef.current.has(item.id)) {
        if (item.type === 'image') {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            mediaElementsRef.current.set(item.id, img);

            if (item.transform.width === 300 && item.transform.height === 200) {
              const maxWidth = CANVAS_WIDTH * 0.3;
              const maxHeight = CANVAS_HEIGHT * 0.3;

              let drawWidth = img.naturalWidth || img.width;
              let drawHeight = img.naturalHeight || img.height;

              if (drawWidth > maxWidth || drawHeight > maxHeight) {
                const widthRatio = maxWidth / drawWidth;
                const heightRatio = maxHeight / drawHeight;
                const ratio = Math.min(widthRatio, heightRatio);
                drawWidth = drawWidth * ratio;
                drawHeight = drawHeight * ratio;
              }

              updateCanvasItemTransform(item.id, {
                width: drawWidth,
                height: drawHeight
              });
            }

            drawCanvas();
          };
          img.src = item.url;
        } else {
          const video = document.createElement('video');
          video.crossOrigin = 'anonymous';
          video.muted = true;
          video.preload = 'metadata';

          video.onloadeddata = () => {
            video.currentTime = 0.1;
            mediaElementsRef.current.set(item.id, video);

            if (item.transform.width === 300 && item.transform.height === 200) {
              const maxWidth = CANVAS_WIDTH * 0.3;
              const maxHeight = CANVAS_HEIGHT * 0.3;

              let drawWidth = video.videoWidth || video.width;
              let drawHeight = video.videoHeight || video.height;

              if (drawWidth > maxWidth || drawHeight > maxHeight) {
                const widthRatio = maxWidth / drawWidth;
                const heightRatio = maxHeight / drawHeight;
                const ratio = Math.min(widthRatio, heightRatio);
                drawWidth = drawWidth * ratio;
                drawHeight = drawHeight * ratio;
              }

              updateCanvasItemTransform(item.id, {
                width: drawWidth,
                height: drawHeight
              });
            }

            drawCanvas();
          };

          video.src = item.url;
        }
      }
    });

    const currentIds = new Set(canvasItems.map(item => item.id));
    const elementIds = Array.from(mediaElementsRef.current.keys());

    elementIds.forEach(id => {
      if (!currentIds.has(id)) {
        mediaElementsRef.current.delete(id);
      }
    });
  }, [canvasItems, updateCanvasItemTransform, drawCanvas]);

  // Add global event listeners for continuous interaction
  useEffect(() => {
    if (isResizing || isRotating || isDragging) {
      // Set cursor style on document body to maintain cursor appearance
      const originalCursor = document.body.style.cursor;

      if (isResizing) {
        document.body.style.cursor = 'nw-resize';
      } else if (isRotating) {
        document.body.style.cursor = 'grab';
      } else if (isDragging) {
        document.body.style.cursor = 'move';
      }

      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
        document.body.style.cursor = originalCursor; // Restore original cursor
      };
    }
  }, [isResizing, isRotating, isDragging, handleGlobalMouseMove, handleGlobalMouseUp]);

  // Redraw when items change
  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = CANVAS_WIDTH;
      canvas.height = CANVAS_HEIGHT;
      drawCanvas();
    }
  }, [drawCanvas]);

  // Export function - without grid lines
  const exportCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    tempCanvas.width = CANVAS_WIDTH;
    tempCanvas.height = CANVAS_HEIGHT;

    // Clear canvas (no grid background)
    tempCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    tempCtx.fillStyle = '#ffffff'; // White background for export
    tempCtx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw all items without handles
    const sortedItems = [...canvasItems].sort((a, b) => a.transform.zIndex - b.transform.zIndex);
    sortedItems.forEach(item => {
      drawMediaItem(tempCtx, item);
    });

    const link = document.createElement('a');
    link.download = 'canvas-export.png';
    link.href = tempCanvas.toDataURL('image/png');
    link.click();
  }, [canvasItems, drawMediaItem]);

  return (
    <div className="flex-1 relative overflow-hidden bg-gray-900 flex flex-col items-center justify-center p-4">
      {/* Canvas */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          className={`border-2 border-gray-600 bg-white shadow-lg ${isDragging ? 'cursor-move' :
            isResizing ? 'cursor-nw-resize' :
              isRotating ? 'cursor-grab' :
                'cursor-crosshair'
            }`}
          style={{
            cursor: isDragging ? 'move' :
              isResizing ? 'nw-resize' :
                isRotating ? 'grab' :
                  'crosshair'
          }}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
        />

        {/* Canvas overlay info */}
        {selectedCanvasItem && (
          <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-2 rounded-lg text-sm">
            <div className="font-medium">{selectedCanvasItem.name}</div>
            <div className="text-xs text-gray-300">
              {selectedCanvasItem.type} • Scale: {Math.round(selectedCanvasItem.transform.scale * 100)}% •
              Rotation: {Math.round(selectedCanvasItem.transform.rotation)}°
            </div>
            <div className="text-xs text-gray-300">
              Position: ({Math.round(selectedCanvasItem.transform.x)}, {Math.round(selectedCanvasItem.transform.y)}) •
              Size: {Math.round(selectedCanvasItem.transform.width)}×{Math.round(selectedCanvasItem.transform.height)}
            </div>
          </div>
        )}

        {/* Export button */}
        {canvasItems.length > 0 && (
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
      {canvasItems.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center p-8">
            <div className="text-gray-400 text-xl mb-2">No media on canvas</div>
            <div className="text-gray-500 text-sm">
              Upload files and add them to canvas to get started
            </div>
          </div>
        </div>
      )}

      {/* Canvas info bar */}
      <div className="mt-4 text-center text-gray-400 text-sm">
        Canvas: {CANVAS_WIDTH} × {CANVAS_HEIGHT}px
        {canvasItems.length > 0 && (
          <span className="ml-4">
            • Items: {canvasItems.length}
            {selectedCanvasItem && (
              <> • Selected: {selectedCanvasItem.name}</>
            )}
          </span>
        )}
      </div>

      {/* Instructions */}
      {canvasItems.length > 0 && (
        <div className="mt-2 text-center text-gray-500 text-xs">
          <div>🔵 Blue squares: Resize • 🟡 Yellow circle: Rotate • 🟢 Green dashed box: Bounding box</div>
          <div>Click to select • Drag to move • Interactions continue outside canvas area</div>
        </div>
      )}
    </div>
  );
};

export default Canvas;