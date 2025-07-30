import { Upload } from "lucide-react";
import { useCallback, useRef } from "react";
import { useMediaEditor } from "../../context/useMediaEditor";

const UploadArea = () => {

  const { handleFilesSelect, isDragging, setIsDragging } = useMediaEditor();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, [setIsDragging]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, [setIsDragging]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set to false if we're leaving the drop area entirely
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragging(false);
    }
  }, [setIsDragging]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      console.log('Files dropped:', files.length);
      handleFilesSelect(files);
    }
  }, [handleFilesSelect, setIsDragging]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      console.log('Files selected:', files.length);
      handleFilesSelect(files);
      // Reset the input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [handleFilesSelect]);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className="mb-6">
      <h2 className="text-sm font-semibold text-gray-300 mb-3 text-center uppercase tracking-wide">Upload Media</h2>
      <div
        className={`
          border-2 border-dashed flex flex-col gap-2 rounded-lg p-6 text-center cursor-pointer transition-all duration-200
          ${isDragging
            ? 'border-orange-500 bg-orange-500/20 scale-105'
            : 'border-gray-600 hover:border-blue-500 hover:bg-blue-500/10'
          }`}
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload
          className={`
            mx-auto mb-2 h-8 w-8 transition-colors
            ${isDragging
              ? 'text-orange-400'
              : 'text-gray-400'
            }`}
        />
        <div className="text-sm font-medium text-gray-300">
          {isDragging ? 'Drop files here!' : 'Drop files here or click to browse'}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Supports images (JPG, PNG, GIF, WebP) and videos (MP4, WebM, MOV). Max File Size(50MB).
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*, video/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
};

export default UploadArea;