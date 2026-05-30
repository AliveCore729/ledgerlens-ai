'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, UploadCloud } from 'lucide-react';
import { toast } from 'sonner'; // Using Sonner instead of use-toast
import { api } from '@/lib/api'; // Updated path based on your new folder structure

export default function UploadPanel() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Frontend validation: 10MB limit based on NestJS config
    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      toast.error('File too large', {
        description: 'Please select a file smaller than 10MB.',
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      await api.post('/uploads/statement', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        },
      });

      // Sonner success toast
      toast.success('Statement uploaded successfully!', {
        description: 'Your data is now being processed.',
      });

      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['statements'] });
      
    } catch (error) {
      console.error('Upload error:', error);
      // Sonner error toast
      toast.error('Upload failed', {
        description: 'Please try again or check your file format.',
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col gap-2">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="application/pdf,image/png,image/jpeg,image/jpg" 
      />
      <Button 
        onClick={triggerFileInput} 
        disabled={isUploading}
        className="flex items-center gap-2"
      >
        {isUploading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Uploading ({uploadProgress}%)
          </>
        ) : (
          <>
            <UploadCloud className="h-4 w-4" />
            Upload Statement
          </>
        )}
      </Button>
      {isUploading && (
        <div className="w-full bg-secondary/50 rounded-full h-1.5 overflow-hidden">
          <div 
            className="bg-primary h-1.5 rounded-full transition-all duration-300 ease-in-out" 
            style={{ width: `${uploadProgress}%` }} 
          />
        </div>
      )}
    </div>
  );
}