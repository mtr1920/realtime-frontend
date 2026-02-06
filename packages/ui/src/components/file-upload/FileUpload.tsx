/**
 * FileUpload Component
 *
 * Drag and drop file upload with preview and progress support.
 */

import {
  forwardRef,
  useCallback,
  useRef,
  useState,
  type DragEvent,
  type ChangeEvent,
  type ReactNode,
} from 'react';
import { Upload, X, File, FileImage, FileText, FileVideo } from 'lucide-react';
import { Button } from '../button';
import { Progress } from '../progress';
import { cn } from '../../utils';

// ============================================================================
// Types
// ============================================================================

export interface UploadedFile {
  /** Unique identifier */
  id: string;
  /** File object */
  file: File;
  /** Upload progress (0-100) */
  progress: number;
  /** Upload status */
  status: 'pending' | 'uploading' | 'complete' | 'error';
  /** Error message if status is error */
  error?: string;
  /** Preview URL for images */
  previewUrl?: string;
}

export interface FileUploadProps {
  /** Called when files are selected */
  onFilesSelected?: (files: File[]) => void;
  /** Called when a file is removed */
  onFileRemove?: (file: UploadedFile) => void;
  /** Currently uploaded files */
  files?: UploadedFile[];
  /** Accepted file types (e.g., ['image/*', '.pdf']) */
  accept?: string[];
  /** Maximum file size in bytes */
  maxSize?: number;
  /** Maximum number of files */
  maxFiles?: number;
  /** Allow multiple files */
  multiple?: boolean;
  /** Whether the upload is disabled */
  disabled?: boolean;
  /** Custom dropzone content */
  children?: ReactNode;
  /** Additional class name */
  className?: string;
}

// ============================================================================
// Helpers
// ============================================================================

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getFileIcon(type: string) {
  if (type.startsWith('image/')) return FileImage;
  if (type.startsWith('video/')) return FileVideo;
  if (type.startsWith('text/') || type.includes('pdf')) return FileText;
  return File;
}

// ============================================================================
// FilePreview Component
// ============================================================================

interface FilePreviewProps {
  file: UploadedFile;
  onRemove?: () => void;
}

function FilePreview({ file, onRemove }: FilePreviewProps) {
  const Icon = getFileIcon(file.file.type);
  const isImage = file.file.type.startsWith('image/');

  return (
    <div className="group relative flex items-center gap-3 rounded-lg border p-3">
      {/* Preview */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
        {isImage && file.previewUrl ? (
          <img
            src={file.previewUrl}
            alt={file.file.name}
            className="h-full w-full rounded-md object-cover"
          />
        ) : (
          <Icon className="h-5 w-5 text-muted-foreground" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 overflow-hidden">
        <p className="truncate text-sm font-medium">{file.file.name}</p>
        <p className="text-xs text-muted-foreground">
          {formatFileSize(file.file.size)}
        </p>

        {/* Progress */}
        {file.status === 'uploading' && (
          <Progress value={file.progress} className="mt-1 h-1" />
        )}

        {/* Error */}
        {file.status === 'error' && (
          <p className="mt-1 text-xs text-destructive">{file.error}</p>
        )}
      </div>

      {/* Remove button */}
      {onRemove && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100"
          onClick={onRemove}
          aria-label={`Remove ${file.file.name}`}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export const FileUpload = forwardRef<HTMLDivElement, FileUploadProps>(
  (
    {
      onFilesSelected,
      onFileRemove,
      files = [],
      accept = [],
      maxSize,
      maxFiles,
      multiple = true,
      disabled = false,
      children,
      className,
    },
    ref
  ) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isDragOver, setIsDragOver] = useState(false);

    const acceptString = accept.join(',');

    const validateFiles = useCallback(
      (fileList: File[]): File[] => {
        return fileList.filter((file) => {
          // Check file type
          if (accept.length > 0) {
            const isAccepted = accept.some((type) => {
              if (type.startsWith('.')) {
                return file.name.toLowerCase().endsWith(type.toLowerCase());
              }
              if (type.endsWith('/*')) {
                return file.type.startsWith(type.replace('/*', '/'));
              }
              return file.type === type;
            });
            if (!isAccepted) return false;
          }

          // Check file size
          if (maxSize && file.size > maxSize) {
            return false;
          }

          return true;
        });
      },
      [accept, maxSize]
    );

    const handleFiles = useCallback(
      (fileList: FileList | File[]) => {
        const filesArray = Array.from(fileList);

        // Limit number of files
        const maxFilesToAdd = maxFiles
          ? Math.max(0, maxFiles - files.length)
          : filesArray.length;
        const filesToProcess = filesArray.slice(0, maxFilesToAdd);

        const validFiles = validateFiles(filesToProcess);
        if (validFiles.length > 0) {
          onFilesSelected?.(validFiles);
        }
      },
      [files.length, maxFiles, validateFiles, onFilesSelected]
    );

    const handleDragOver = useCallback(
      (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (!disabled) {
          setIsDragOver(true);
        }
      },
      [disabled]
    );

    const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);
    }, []);

    const handleDrop = useCallback(
      (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(false);

        if (!disabled && e.dataTransfer.files.length > 0) {
          handleFiles(e.dataTransfer.files);
        }
      },
      [disabled, handleFiles]
    );

    const handleInputChange = useCallback(
      (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
          handleFiles(e.target.files);
          // Reset input so same file can be selected again
          e.target.value = '';
        }
      },
      [handleFiles]
    );

    const handleClick = useCallback(() => {
      if (!disabled) {
        inputRef.current?.click();
      }
    }, [disabled]);

    const canAddMore = !maxFiles || files.length < maxFiles;

    return (
      <div ref={ref} className={cn('space-y-4', className)}>
        {/* Dropzone */}
        {canAddMore && (
          <div
            role="button"
            tabIndex={disabled ? -1 : 0}
            onClick={handleClick}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleClick();
              }
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              'relative cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors',
              'hover:border-primary hover:bg-muted/50',
              'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
              isDragOver && 'border-primary bg-muted/50',
              disabled &&
                'cursor-not-allowed opacity-50 hover:border-border hover:bg-transparent'
            )}
          >
            <input
              ref={inputRef}
              type="file"
              accept={acceptString}
              multiple={multiple}
              onChange={handleInputChange}
              disabled={disabled}
              className="sr-only"
              aria-label="File upload"
            />

            {children ?? (
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    Drop files here or click to upload
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {accept.length > 0
                      ? `Accepts: ${accept.join(', ')}`
                      : 'All file types accepted'}
                    {maxSize && ` • Max size: ${formatFileSize(maxSize)}`}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* File list */}
        {files.length > 0 && (
          <div className="space-y-2">
            {files.map((file) => (
              <FilePreview
                key={file.id}
                file={file}
                onRemove={onFileRemove ? () => onFileRemove(file) : undefined}
              />
            ))}
          </div>
        )}
      </div>
    );
  }
);
FileUpload.displayName = 'FileUpload';
