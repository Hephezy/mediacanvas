// Types
export interface MediaItem {
  id: string;
  file: File;
  url: string;
  type: "image" | "video";
  name: string;
  size: number;
}

export interface MediaEditorState {
  mediaItems: MediaItem[];
  selectedMediaId: string | null;
  selectedMedia: MediaItem | null;
  scale: number;
  rotation: number;
  isDragging: boolean;
  history: Array<{
    mediaItems: MediaItem[];
    selectedMediaId: string | null;
    scale: number;
    rotation: number;
  }>;
  historyIndex: number;
}

export interface MediaEditorActions {
  handleFilesSelect: (files: FileList) => void;
  selectMedia: (id: string) => void;
  handleScaleChange: (delta: number) => void;
  handleRotation: (degrees: number) => void;
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
