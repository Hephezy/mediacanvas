import { Play, Image, X, Plus, EyeOff } from 'lucide-react';
import { useMediaEditor } from '../../context/useMediaEditor';

const MediaList = () => {
  const {
    mediaItems,
    canvasItems,
    selectedMediaId,
    selectMedia,
    removeMedia,
    addToCanvas,
    removeFromCanvas
  } = useMediaEditor();

  if (mediaItems.length === 0) {
    return null;
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isOnCanvas = (itemId: string): boolean => {
    return canvasItems.some(item => item.id === itemId);
  };

  return (
    <div className="mb-6">
      <h2 className="text-sm font-semibold text-gray-300 mb-3 text-center uppercase tracking-wide">
        Media Files ({mediaItems.length})
      </h2>
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {mediaItems.map((item) => {
          const onCanvas = isOnCanvas(item.id);

          return (
            <div
              key={item.id}
              className={`
                relative group p-3 rounded-lg border-2 cursor-pointer transition-all duration-200
                ${selectedMediaId === item.id
                  ? 'border-blue-500 bg-blue-500/20'
                  : onCanvas
                    ? 'border-green-500 bg-green-500/10'
                    : 'border-gray-600 hover:border-gray-500 bg-gray-800/50'
                }
              `}
              onClick={() => selectMedia(item.id)}
            >
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  {item.type === 'image' ? (
                    <div className="relative">
                      <img
                        src={item.url}
                        alt={item.name}
                        className="w-12 h-12 object-cover rounded border border-gray-600"
                      />
                      <Image className="absolute -bottom-1 -right-1 w-4 h-4 text-blue-400 bg-gray-800 rounded-full p-0.5" />
                    </div>
                  ) : (
                    <div className="relative">
                      <video
                        src={item.url}
                        className="w-12 h-12 object-cover rounded border border-gray-600"
                        muted
                      />
                      <Play className="absolute -bottom-1 -right-1 w-4 h-4 text-green-400 bg-gray-800 rounded-full p-0.5" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-300 truncate">
                    {item.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatFileSize(item.size)} • {item.type}
                  </div>
                  {onCanvas && (
                    <div className="text-xs text-green-400 mt-1">
                      ✓ On Canvas
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  {/* Canvas toggle button */}
                  {onCanvas ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromCanvas(item.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 bg-red-600 hover:bg-red-700 text-white rounded p-1 transition-all duration-200"
                      title="Remove from canvas"
                    >
                      <EyeOff className="w-3 h-3" />
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCanvas(item.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 bg-green-600 hover:bg-green-700 text-white rounded p-1 transition-all duration-200"
                      title="Add to canvas"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  )}

                  {/* Remove button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeMedia(item.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 bg-red-500 hover:bg-red-600 text-white rounded p-1 transition-all duration-200"
                    title="Delete file"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Canvas items summary */}
      {canvasItems.length > 0 && (
        <div className="mt-3 p-2 bg-gray-800 rounded text-xs text-gray-400 text-center">
          {canvasItems.length} item{canvasItems.length !== 1 ? 's' : ''} on canvas
        </div>
      )}
    </div>
  );
};

export default MediaList;