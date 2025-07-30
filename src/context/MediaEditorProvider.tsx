import { useState, useCallback, type ReactNode } from 'react';
import { MediaEditorContext } from './MediaContext';
import type { MediaEditorContextType, MediaItem } from '../../types/index';

interface MediaEditorProviderProps {
  children: ReactNode;
}

export const MediaEditorProvider = ({ children }: MediaEditorProviderProps) => {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null);
  const [scale, setScale] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [history, setHistory] = useState<Array<{
    mediaItems: MediaItem[];
    selectedMediaId: string | null;
    scale: number;
    rotation: number;
  }>>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Get currently selected media
  const selectedMedia = mediaItems.find(item => item.id === selectedMediaId) || null;

  // Add to history
  const addToHistory = useCallback(() => {
    const newHistoryItem = {
      mediaItems: [...mediaItems],
      selectedMediaId,
      scale,
      rotation
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
  }, [mediaItems, selectedMediaId, scale, rotation, history, historyIndex]);

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
      addToHistory();
      setMediaItems(prev => [...prev, ...newMediaItems]);
      // Auto-select the first uploaded item if none selected
      if (!selectedMediaId && newMediaItems.length > 0) {
        setSelectedMediaId(newMediaItems[0].id);
        setScale(1);
        setRotation(0);
      }
    }
  }, [selectedMediaId, addToHistory]);

  const selectMedia = useCallback((id: string): void => {
    addToHistory();
    setSelectedMediaId(id);
    setScale(1);
    setRotation(0);
  }, [addToHistory]);

  const handleScaleChange = useCallback((delta: number): void => {
    setScale(prev => Math.max(0.1, Math.min(3, prev + delta)));
  }, []);

  const handleRotation = useCallback((degrees: number): void => {
    setRotation(prev => (prev + degrees) % 360);
  }, []);

  const removeMedia = useCallback((id: string): void => {
    addToHistory();
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

    if (selectedMediaId === id) {
      const remainingItems = mediaItems.filter(item => item.id !== id);
      setSelectedMediaId(remainingItems.length > 0 ? remainingItems[0].id : null);
      setScale(1);
      setRotation(0);
    }
  }, [selectedMediaId, mediaItems, addToHistory]);

  const clearAllMedia = useCallback((): void => {
    addToHistory();
    mediaItems.forEach(item => URL.revokeObjectURL(item.url));
    setMediaItems([]);
    setSelectedMediaId(null);
    setScale(1);
    setRotation(0);
  }, [mediaItems, addToHistory]);

  const undo = useCallback((): void => {
    if (historyIndex > 0) {
      const previousState = history[historyIndex - 1];
      setMediaItems(previousState.mediaItems);
      setSelectedMediaId(previousState.selectedMediaId);
      setScale(previousState.scale);
      setRotation(previousState.rotation);
      setHistoryIndex(prev => prev - 1);
    }
  }, [history, historyIndex]);

  const redo = useCallback((): void => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setMediaItems(nextState.mediaItems);
      setSelectedMediaId(nextState.selectedMediaId);
      setScale(nextState.scale);
      setRotation(nextState.rotation);
      setHistoryIndex(prev => prev + 1);
    }
  }, [history, historyIndex]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const value: MediaEditorContextType = {
    // State
    mediaItems,
    selectedMediaId,
    selectedMedia,
    scale,
    rotation,
    isDragging,
    history,
    historyIndex,
    // Actions
    handleFilesSelect,
    selectMedia,
    handleScaleChange,
    handleRotation,
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