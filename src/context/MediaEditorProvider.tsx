import { useState, useCallback, type ReactNode } from 'react';
import { MediaEditorContext } from './MediaContext';
import type { MediaEditorContextType, MediaItem, CanvasMediaItem, MediaTransform } from '../../types/index';

interface MediaEditorProviderProps {
  children: ReactNode;
}

export const MediaEditorProvider = ({ children }: MediaEditorProviderProps) => {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [canvasItems, setCanvasItems] = useState<CanvasMediaItem[]>([]);
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [history, setHistory] = useState<Array<{
    canvasItems: CanvasMediaItem[];
    selectedMediaId: string | null;
  }>>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Get currently selected media from sidebar
  const selectedMedia = mediaItems.find(item => item.id === selectedMediaId) || null;

  // Get currently selected canvas item
  const selectedCanvasItem = canvasItems.find(item => item.id === selectedMediaId) || null;

  // Add to history
  const addToHistory = useCallback(() => {
    const newHistoryItem = {
      canvasItems: canvasItems.map(item => ({ ...item })),
      selectedMediaId
    };

    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newHistoryItem);

    // Keep only last 50 history items
    if (newHistory.length > 50) {
      newHistory.shift();
    } else {
      setHistoryIndex(prev => prev + 1);
    }

    setHistory(newHistory);
  }, [canvasItems, selectedMediaId, history, historyIndex]);

  const handleFilesSelect = useCallback((files: FileList): void => {
    const newMediaItems: MediaItem[] = [];

    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        const url = URL.createObjectURL(file);
        const mediaItem: MediaItem = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          file,
          url,
          type: file.type.startsWith('image/') ? 'image' : 'video',
          name: file.name,
          size: file.size
        };
        newMediaItems.push(mediaItem);
      }
    });

    if (newMediaItems.length > 0) {
      setMediaItems(prev => [...prev, ...newMediaItems]);
      // Auto-select the first uploaded item if none selected
      if (!selectedMediaId && newMediaItems.length > 0) {
        setSelectedMediaId(newMediaItems[0].id);
      }
    }
  }, [selectedMediaId]);

  const selectMedia = useCallback((id: string): void => {
    setSelectedMediaId(id);
  }, []);

  const addToCanvas = useCallback((mediaId: string): void => {
    const mediaItem = mediaItems.find(item => item.id === mediaId);
    if (!mediaItem) return;

    // Check if item is already on canvas
    const existingItem = canvasItems.find(item => item.id === mediaId);
    if (existingItem) {
      setSelectedMediaId(mediaId);
      return;
    }

    addToHistory();

    // Create canvas item with default transform
    const canvasItem: CanvasMediaItem = {
      ...mediaItem,
      transform: {
        x: 0, // Center position
        y: 0, // Center position
        width: 300, // Default size, will be adjusted when element loads
        height: 200,
        scale: 1,
        rotation: 0,
        zIndex: canvasItems.length
      }
    };

    setCanvasItems(prev => [...prev, canvasItem]);
    setSelectedMediaId(mediaId);
  }, [mediaItems, canvasItems, addToHistory]);

  const selectCanvasItem = useCallback((id: string): void => {
    setSelectedMediaId(id);
  }, []);

  const updateCanvasItemTransform = useCallback((id: string, transform: Partial<MediaTransform>): void => {
    setCanvasItems(prev => prev.map(item =>
      item.id === id
        ? { ...item, transform: { ...item.transform, ...transform } }
        : item
    ));
  }, []);

  const removeFromCanvas = useCallback((id: string): void => {
    addToHistory();
    setCanvasItems(prev => prev.filter(item => item.id !== id));

    if (selectedMediaId === id) {
      const remainingItems = canvasItems.filter(item => item.id !== id);
      setSelectedMediaId(remainingItems.length > 0 ? remainingItems[0].id : null);
    }
  }, [selectedMediaId, canvasItems, addToHistory]);

  const removeMedia = useCallback((id: string): void => {
    addToHistory();

    // Remove from media items
    setMediaItems(prev => {
      const filtered = prev.filter(item => {
        if (item.id === id) {
          URL.revokeObjectURL(item.url);
          return false;
        }
        return true;
      });
      return filtered;
    });

    // Remove from canvas if present
    setCanvasItems(prev => prev.filter(item => item.id !== id));

    if (selectedMediaId === id) {
      const remainingItems = mediaItems.filter(item => item.id !== id);
      setSelectedMediaId(remainingItems.length > 0 ? remainingItems[0].id : null);
    }
  }, [selectedMediaId, mediaItems, addToHistory]);

  const clearAllMedia = useCallback((): void => {
    addToHistory();
    mediaItems.forEach(item => URL.revokeObjectURL(item.url));
    setMediaItems([]);
    setCanvasItems([]);
    setSelectedMediaId(null);
  }, [mediaItems, addToHistory]);

  const undo = useCallback((): void => {
    if (historyIndex > 0) {
      const previousState = history[historyIndex - 1];
      setCanvasItems(previousState.canvasItems);
      setSelectedMediaId(previousState.selectedMediaId);
      setHistoryIndex(prev => prev - 1);
    }
  }, [history, historyIndex]);

  const redo = useCallback((): void => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setCanvasItems(nextState.canvasItems);
      setSelectedMediaId(nextState.selectedMediaId);
      setHistoryIndex(prev => prev + 1);
    }
  }, [history, historyIndex]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const value: MediaEditorContextType = {
    // State
    mediaItems,
    canvasItems,
    selectedMediaId,
    selectedMedia,
    selectedCanvasItem,
    isDragging,
    history,
    historyIndex,
    // Actions
    handleFilesSelect,
    selectMedia,
    addToCanvas,
    selectCanvasItem,
    updateCanvasItemTransform,
    removeFromCanvas,
    clearAllMedia,
    removeMedia,
    setIsDragging,
    undo,
    redo,
    canUndo,
    canRedo,
  };

  return (
    <MediaEditorContext.Provider value={value}>
      {children}
    </MediaEditorContext.Provider>
  );
};