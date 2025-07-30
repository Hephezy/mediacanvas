import { createContext } from "react";
import type { MediaEditorContextType } from "../../types/index";

// Context for state management
export const MediaEditorContext = createContext<
  MediaEditorContextType | undefined
>(undefined);
