import { useContext } from 'react';
import { MediaEditorContext } from './MediaContext';
import type { MediaEditorContextType } from '../../types/index';

export const useMediaEditor = (): MediaEditorContextType => {
  const context = useContext(MediaEditorContext);
  if (!context) {
    throw new Error('useMediaEditor must be used within a MediaEditorProvider');
  }
  return context;
};