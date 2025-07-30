import { RotateCcw, RotateCw, ZoomIn, ZoomOut } from 'lucide-react';
import { useMediaEditor } from '../../context/useMediaEditor';

const MediaControls = () => {
  const { selectedMedia, scale, rotation, handleScaleChange, handleRotation } = useMediaEditor();

  if (!selectedMedia) {
    return null;
  }

  return (
    <div className="mb-6">
      <h2 className="text-sm font-semibold text-gray-300 mb-3 text-center uppercase tracking-wide">
        Transform Controls
      </h2>

      {/* Scale Controls */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-400 uppercase tracking-wide">Scale</span>
          <span className="text-sm font-medium text-gray-300">{Math.round(scale * 100)}%</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleScaleChange(-0.1)}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded transition-colors flex items-center justify-center gap-2"
            disabled={scale <= 0.1}
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
            <span className="text-sm">Out</span>
          </button>
          <button
            onClick={() => handleScaleChange(0.1)}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded transition-colors flex items-center justify-center gap-2"
            disabled={scale >= 3}
            title="Zoom In"
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
          <span className="text-sm font-medium text-gray-300">{rotation}°</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleRotation(-90)}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded transition-colors flex items-center justify-center gap-2"
            title="Rotate Left"
          >
            <RotateCcw className="h-4 w-4" />
            <span className="text-sm">Left</span>
          </button>
          <button
            onClick={() => handleRotation(90)}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded transition-colors flex items-center justify-center gap-2"
            title="Rotate Right"
          >
            <RotateCw className="h-4 w-4" />
            <span className="text-sm">Right</span>
          </button>
        </div>
      </div>

      {/* Reset Button */}
      <button
        onClick={() => {
          handleScaleChange(1 - scale);
          handleRotation(-rotation);
        }}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors text-sm font-medium"
        title="Reset transformations"
      >
        Reset Transform
      </button>
    </div>
  );
};

export default MediaControls;