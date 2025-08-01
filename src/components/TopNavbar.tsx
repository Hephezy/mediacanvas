import { Trash2 } from 'lucide-react';
import { useMediaEditor } from '../context/useMediaEditor';

const TopNavbar = () => {
  const { clearAllMedia, mediaItems } = useMediaEditor();

  return (
    <div className='h-15 bg-gray-800 border-b border-gray-700 px-5 py-3 flex items-center gap-4'>
      <div className='flex flex-row items-center gap-3'>
        <button
          onClick={clearAllMedia}
          disabled={mediaItems.length === 0}
          className="bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-2 rounded text-lg text-gray-300 flex items-center gap-2 transition-colors"
          title="Clear all media"
        >
          <Trash2 className="h-8 w-8" />
          Clear All
        </button>
      </div>

      {mediaItems.length > 0 && (
        <div className="ml-auto text-sm text-gray-400">
          {mediaItems.length} item{mediaItems.length !== 1 ? 's' : ''} loaded
        </div>
      )}
    </div>
  );
};

export default TopNavbar;