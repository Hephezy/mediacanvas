import { RotateCcw, RotateCw, ZoomIn, ZoomOut, Move } from 'lucide-react';
import { useMediaEditor } from '../../context/useMediaEditor';

const MediaControls = () => {
  const {
    selectedCanvasItem,
    updateCanvasItemTransform,
    canvasItems
  } = useMediaEditor();

  if (!selectedCanvasItem) {
    return (
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-gray-300 mb-3 text-center uppercase tracking-wide">
          Transform Controls
        </h2>
        <div className="p-4 text-center text-gray-500 text-sm">
          {canvasItems.length === 0
            ? "Add media to canvas to see controls"
            : "Select an item on canvas to edit"
          }
        </div>
      </div>
    );
  }

  const { transform } = selectedCanvasItem;

  const handleScaleChange = (delta: number) => {
    const newScale = Math.max(0.1, Math.min(3, transform.scale + delta));
    updateCanvasItemTransform(selectedCanvasItem.id, { scale: newScale });
  };

  const handleRotation = (degrees: number) => {
    const newRotation = (transform.rotation + degrees) % 360;
    updateCanvasItemTransform(selectedCanvasItem.id, { rotation: newRotation });
  };

  const handlePositionChange = (axis: 'x' | 'y', delta: number) => {
    updateCanvasItemTransform(selectedCanvasItem.id, {
      [axis]: transform[axis] + delta
    });
  };

  const resetTransform = () => {
    updateCanvasItemTransform(selectedCanvasItem.id, {
      scale: 1,
      rotation: 0,
      x: 0,
      y: 0
    });
  };

  const bringToFront = () => {
    const maxZ = Math.max(...canvasItems.map(item => item.transform.zIndex));
    updateCanvasItemTransform(selectedCanvasItem.id, {
      zIndex: maxZ + 1
    });
  };

  const sendToBack = () => {
    const minZ = Math.min(...canvasItems.map(item => item.transform.zIndex));
    updateCanvasItemTransform(selectedCanvasItem.id, {
      zIndex: minZ - 1
    });
  };

  return (
    <div className="mb-6">
      <h2 className="text-sm font-semibold text-gray-300 mb-3 text-center uppercase tracking-wide">
        Transform Controls
      </h2>

      {/* Selected item info */}
      <div className="mb-4 p-2 bg-gray-800 rounded">
        <div className="text-xs font-medium text-gray-300 truncate">
          {selectedCanvasItem.name}
        </div>
        <div className="text-xs text-gray-500">
          Layer {transform.zIndex + 1}
        </div>
      </div>

      {/* Scale Controls */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-400 uppercase tracking-wide">Scale</span>
          <span className="text-sm font-medium text-gray-300">{Math.round(transform.scale * 100)}%</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleScaleChange(-0.1)}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded transition-colors flex items-center justify-center gap-2"
            disabled={transform.scale <= 0.1}
            title="Scale Down"
          >
            <ZoomOut className="h-4 w-4" />
            <span className="text-sm">Out</span>
          </button>
          <button
            onClick={() => handleScaleChange(0.1)}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded transition-colors flex items-center justify-center gap-2"
            disabled={transform.scale >= 3}
            title="Scale Up"
          >
            <ZoomIn className="h-4 w-4" />
            <span className="text-sm">In</span>
          </button>
        </div>
      </div>

      {/* Rotation Controls */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-400 uppercase tracking-wide">Rotation</span>
          <span className="text-sm font-medium text-gray-300">{transform.rotation}°</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => handleRotation(-90)}
            className="bg-gray-700 hover:bg-gray-600 text-white px-2 py-2 rounded transition-colors flex items-center justify-center"
            title="Rotate Left 90°"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleRotation(-15)}
            className="bg-gray-700 hover:bg-gray-600 text-white px-2 py-2 rounded transition-colors text-sm"
            title="Rotate Left 15°"
          >
            -15°
          </button>
          <button
            onClick={() => handleRotation(15)}
            className="bg-gray-700 hover:bg-gray-600 text-white px-2 py-2 rounded transition-colors text-sm"
            title="Rotate Right 15°"
          >
            +15°
          </button>
        </div>
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => handleRotation(90)}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded transition-colors flex items-center justify-center gap-2"
            title="Rotate Right 90°"
          >
            <RotateCw className="h-4 w-4" />
            <span className="text-sm">90°</span>
          </button>
        </div>
      </div>

      {/* Position Controls */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-400 uppercase tracking-wide">Position</span>
          <span className="text-sm font-medium text-gray-300">
            {Math.round(transform.x)}, {Math.round(transform.y)}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-1">
          <div></div>
          <button
            onClick={() => handlePositionChange('y', -10)}
            className="bg-gray-700 hover:bg-gray-600 text-white px-2 py-2 rounded transition-colors flex items-center justify-center"
            title="Move Up"
          >
            ↑
          </button>
          <div></div>
          <button
            onClick={() => handlePositionChange('x', -10)}
            className="bg-gray-700 hover:bg-gray-600 text-white px-2 py-2 rounded transition-colors flex items-center justify-center"
            title="Move Left"
          >
            ←
          </button>
          <button
            onClick={() => updateCanvasItemTransform(selectedCanvasItem.id, { x: 0, y: 0 })}
            className="bg-gray-700 hover:bg-gray-600 text-white px-2 py-2 rounded transition-colors flex items-center justify-center text-xs"
            title="Center"
          >
            <Move className="h-3 w-3" />
          </button>
          <button
            onClick={() => handlePositionChange('x', 10)}
            className="bg-gray-700 hover:bg-gray-600 text-white px-2 py-2 rounded transition-colors flex items-center justify-center"
            title="Move Right"
          >
            →
          </button>
          <div></div>
          <button
            onClick={() => handlePositionChange('y', 10)}
            className="bg-gray-700 hover:bg-gray-600 text-white px-2 py-2 rounded transition-colors flex items-center justify-center"
            title="Move Down"
          >
            ↓
          </button>
          <div></div>
        </div>
      </div>

      {/* Layer Controls */}
      {canvasItems.length > 1 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 uppercase tracking-wide">Layer Order</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={sendToBack}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded transition-colors text-sm"
              title="Send to Back"
            >
              To Back
            </button>
            <button
              onClick={bringToFront}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded transition-colors text-sm"
              title="Bring to Front"
            >
              To Front
            </button>
          </div>
        </div>
      )}

      {/* Reset Button */}
      <button
        onClick={resetTransform}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors text-sm font-medium"
        title="Reset all transformations"
      >
        Reset Transform
      </button>
    </div>
  );
};

export default MediaControls;