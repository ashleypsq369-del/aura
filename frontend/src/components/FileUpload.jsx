import { useState, useRef } from 'react';
import { Upload, X, File, Image as ImageIcon, Video, Music, FileText, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import apiClient from '../api/client';
import toast from '../utils/toast';

export default function FileUpload({ 
  category = 'documents', 
  relatedId = null,
  onUploadComplete = null,
  accept = '*',
  multiple = false,
  maxSizeMB = 50,
  className = ''
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const fileInputRef = useRef(null);

  const getFileIcon = (mimeType) => {
    if (mimeType.startsWith('image/')) return ImageIcon;
    if (mimeType.startsWith('video/')) return Video;
    if (mimeType.startsWith('audio/')) return Music;
    if (mimeType.startsWith('application/pdf')) return FileText;
    return File;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    
    // Validate file size
    const maxSize = maxSizeMB * 1024 * 1024;
    const invalidFiles = files.filter(f => f.size > maxSize);
    
    if (invalidFiles.length > 0) {
      toast.error(`Some files are too large. Max size: ${maxSizeMB}MB`);
      return;
    }
    
    setSelectedFiles(files);
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select files to upload');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      
      if (multiple) {
        // Multiple files
        selectedFiles.forEach((file) => {
          formData.append('files', file);
        });
        formData.append('category', category);
        if (relatedId) formData.append('related_id', relatedId);

        const response = await apiClient.post('/api/uploads/upload-multiple', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        });

        toast.success(`${response.data.count} file(s) uploaded successfully!`);
        if (onUploadComplete) onUploadComplete(response.data.files);
      } else {
        // Single file
        formData.append('file', selectedFiles[0]);
        formData.append('category', category);
        if (relatedId) formData.append('related_id', relatedId);

        const response = await apiClient.post('/api/uploads/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        });

        toast.success('File uploaded successfully!');
        if (onUploadComplete) onUploadComplete([response.data]);
      }

      // Reset
      setSelectedFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.detail || 'Failed to upload file');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* File Input */}
      <div className="relative">
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileSelect}
          className="hidden"
          id="file-upload-input"
        />
        
        <label
          htmlFor="file-upload-input"
          className="flex items-center justify-center w-full px-6 py-4 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-all"
        >
          <div className="text-center">
            <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
            <p className="text-sm font-medium text-slate-700">
              {multiple ? 'Click to select files' : 'Click to select a file'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Max size: {maxSizeMB}MB
            </p>
          </div>
        </label>
      </div>

      {/* Selected Files List */}
      <AnimatePresence>
        {selectedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            {selectedFiles.map((file, index) => {
              const FileIcon = getFileIcon(file.type);
              
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <FileIcon className="w-5 h-5 text-slate-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => removeFile(index)}
                    disabled={uploading}
                    className="ml-2 p-1 hover:bg-slate-200 rounded transition-colors disabled:opacity-50"
                  >
                    <X className="w-4 h-4 text-slate-600" />
                  </button>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Progress */}
      {uploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-700 font-medium">Uploading...</span>
            <span className="text-slate-600">{uploadProgress}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
            <motion.div
              className="h-full bg-purple-600 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${uploadProgress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      )}

      {/* Upload Button */}
      {selectedFiles.length > 0 && !uploading && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={handleUpload}
          className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all shadow-lg hover:shadow-xl"
        >
          <Check className="w-5 h-5" />
          <span className="font-medium">
            Upload {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''}
          </span>
        </motion.button>
      )}
    </div>
  );
}
