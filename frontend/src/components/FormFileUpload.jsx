import { useState } from 'react';
import { Paperclip, X, File, Image, Video, FileText } from 'lucide-react';
import FileUpload from './FileUpload';
import toast from '../utils/toast';

/**
 * FormFileUpload - A reusable file upload component for forms
 * Easy to add to any form with minimal code
 */
export default function FormFileUpload({ 
  category = 'documents',
  relatedId = null,
  accept = 'image/*,.pdf,.doc,.docx',
  multiple = true,
  maxSizeMB = 50,
  label = 'Attach Files',
  description = 'Upload supporting files',
  onFilesAttached = null,
  className = ''
}) {
  const [showUpload, setShowUpload] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState([]);

  const handleUploadComplete = (files) => {
    setAttachedFiles(files);
    toast.success(`✓ ${files.length} file(s) attached`);
    if (onFilesAttached) {
      onFilesAttached(files);
    }
  };

  const handleRemoveFile = (fileId) => {
    const updated = attachedFiles.filter(f => f.id !== fileId);
    setAttachedFiles(updated);
    toast.success('File removed');
    if (onFilesAttached) {
      onFilesAttached(updated);
    }
  };

  const getFileIcon = (mimeType) => {
    if (mimeType?.startsWith('image/')) return Image;
    if (mimeType?.startsWith('video/')) return Video;
    if (mimeType?.includes('pdf')) return FileText;
    return File;
  };

  return (
    <div className={`${className}`}>
      {/* Attachment Button */}
      {!showUpload && (
        <button
          type="button"
          onClick={() => setShowUpload(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-teal-700 bg-teal-50 border-2 border-teal-200 rounded-lg hover:bg-teal-100 hover:border-teal-300 transition-all"
        >
          <Paperclip size={16} />
          <span>{label}</span>
          {attachedFiles.length > 0 && (
            <span className="px-2 py-0.5 bg-teal-600 text-white text-xs rounded-full">
              {attachedFiles.length}
            </span>
          )}
        </button>
      )}

      {/* Upload Section */}
      {showUpload && (
        <div className="p-4 bg-[var(--card-bg)] rounded-lg border-2 border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="text-sm font-bold text-slate-900">{label}</h4>
              <p className="text-xs text-[var(--text-600)] mt-0.5">{description}</p>
            </div>
            <button
              type="button"
              onClick={() => setShowUpload(false)}
              className="p-1 text-[var(--text-500)] hover:text-[var(--text-700)] hover:bg-slate-200 rounded transition-colors"
              title="Close"
            >
              <X size={18} />
            </button>
          </div>

          <FileUpload
            category={category}
            relatedId={relatedId}
            onUploadComplete={handleUploadComplete}
            accept={accept}
            multiple={multiple}
            maxSizeMB={maxSizeMB}
          />

          {/* Attached Files List */}
          {attachedFiles.length > 0 && (
            <div className="mt-3 space-y-2">
              <p className="text-xs font-bold text-[var(--text-700)] uppercase">
                Attached Files ({attachedFiles.length})
              </p>
              {attachedFiles.map((file) => {
                const FileIcon = getFileIcon(file.mime_type);
                return (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-2 bg-[var(--card-bg)] rounded border border-slate-200"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <FileIcon size={16} className="text-teal-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--text-900)] truncate">
                          {file.original_filename}
                        </p>
                        <p className="text-xs text-slate-500">
                          {(file.file_size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(file.id)}
                      className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                      title="Remove file"
                    >
                      <X size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Summary when closed */}
      {!showUpload && attachedFiles.length > 0 && (
        <div className="mt-2 text-xs text-slate-600">
          ✓ {attachedFiles.length} file(s) attached - 
          <button
            type="button"
            onClick={() => setShowUpload(true)}
            className="text-teal-600 hover:text-teal-700 ml-1 underline"
          >
            View/Edit
          </button>
        </div>
      )}
    </div>
  );
}
