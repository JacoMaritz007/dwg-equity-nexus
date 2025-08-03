import React, { useCallback, useState } from 'react';
import { Upload, X, FileText, Image, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface FileUploadFieldProps {
  label: string;
  description?: string;
  accept: string;
  multiple?: boolean;
  required?: boolean;
  maxFiles?: number;
  maxSizeMB?: number;
  value: File[] | null;
  onChange: (files: File[] | null) => void;
  className?: string;
}

export const FileUploadField: React.FC<FileUploadFieldProps> = ({
  label,
  description,
  accept,
  multiple = false,
  required = false,
  maxFiles = 1,
  maxSizeMB = 10,
  value,
  onChange,
  className
}) => {
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();

  const validateFile = (file: File): boolean => {
    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      toast({
        title: "File too large",
        description: `File size must be less than ${maxSizeMB}MB`,
        variant: "destructive"
      });
      return false;
    }

    const acceptedTypes = accept.split(',').map(type => type.trim());
    const isValidType = acceptedTypes.some(type => {
      if (type.startsWith('.')) {
        return file.name.toLowerCase().endsWith(type.toLowerCase());
      }
      return file.type.match(type.replace('*', '.*'));
    });

    if (!isValidType) {
      toast({
        title: "Invalid file type",
        description: `Please select a file of type: ${accept}`,
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;

    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(validateFile);

    if (multiple) {
      const currentFiles = value || [];
      const newFiles = [...currentFiles, ...validFiles];
      
      if (newFiles.length > maxFiles) {
        toast({
          title: "Too many files",
          description: `Maximum ${maxFiles} files allowed`,
          variant: "destructive"
        });
        return;
      }
      
      onChange(newFiles);
    } else {
      onChange(validFiles.length > 0 ? [validFiles[0]] : null);
    }
  }, [value, multiple, maxFiles, onChange, toast, validateFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const removeFile = (index: number) => {
    if (!value) return;
    const newFiles = value.filter((_, i) => i !== index);
    onChange(newFiles.length > 0 ? newFiles : null);
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (file.type.startsWith('video/')) return <Video className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={`file-upload-${label}`}>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer",
          dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25",
          "hover:border-primary hover:bg-primary/5"
        )}
        onDrop={handleDrop}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onClick={() => document.getElementById(`file-upload-${label}`)?.click()}
      >
        <div className="flex flex-col items-center text-center">
          <Upload className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm font-medium">
            Drop files here or click to browse
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {accept} • Max {maxSizeMB}MB {multiple && `• Up to ${maxFiles} files`}
          </p>
        </div>
      </div>

      <Input
        id={`file-upload-${label}`}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {value && value.length > 0 && (
        <div className="space-y-2">
          {value.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-muted rounded-lg"
            >
              <div className="flex items-center gap-2">
                {getFileIcon(file)}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(index);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};