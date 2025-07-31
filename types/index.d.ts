// Enhanced Types for Multi-Media Canvas
export interface MediaItem {
  id: string;
  file: File;
  url: string;
  type: "image" | "video";
  name: string;
  size: number;
}

export interface MediaTransform {
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
  rotation: number;
  zIndex: number;
}

export interface CanvasMediaItem extends MediaItem {
  transform: MediaTransform;
  element?: HTMLImageElement | HTMLVideoElement;
}

export interface MediaEditorState {
  mediaItems: MediaItem[];
  canvasItems: CanvasMediaItem[];
  selectedMediaId: string | null;
  selectedMedia: MediaItem | null;
  selectedCanvasItem: CanvasMediaItem | null;
  isDragging: boolean;
  history: Array<{
    canvasItems: CanvasMediaItem[];
    selectedMediaId: string | null;
  }>;
  historyIndex: number;
}

export interface MediaEditorActions {
  handleFilesSelect: (files: FileList) => void;
  selectMedia: (id: string) => void;
  addToCanvas: (mediaId: string) => void;
  selectCanvasItem: (id: string) => void;
  updateCanvasItemTransform: (
    id: string,
    transform: Partial<MediaTransform>
  ) => void;
  removeFromCanvas: (id: string) => void;
  clearAllMedia: () => void;
  removeMedia: (id: string) => void;
  setIsDragging: (isDragging: boolean) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export interface MediaEditorContextType
  extends MediaEditorState,
    MediaEditorActions {}
