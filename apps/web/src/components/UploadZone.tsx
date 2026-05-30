"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, File as FileIcon, X, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import axios from "axios";

export function UploadZone() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [success, setSuccess] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setSuccess(false);
      setProgress(0);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
    },
    maxFiles: 1,
  });

  const uploadFile = async () => {
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      // Assuming you have an API route or proxy configured
      await axios.post("http://localhost:3001/uploads/statement", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || file.size)
          );
          setProgress(percentCompleted);
        },
      });
      setSuccess(true);
      toast.success("File uploaded successfully! It is now being processed.");
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload the file. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {!file ? (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
            isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
          }`}
        >
          <input {...getInputProps()} />
          <UploadCloud className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">Drag & drop your statement here</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Supports PDF, JPG, PNG up to 10MB
          </p>
          <Button variant="secondary" className="mt-6">Browse Files</Button>
        </div>
      ) : (
        <div className="border rounded-xl p-6 bg-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-primary/10 rounded-lg text-primary">
                <FileIcon className="w-6 h-6" />
              </div>
              <div>
                <p className="font-medium text-sm truncate max-w-[200px] sm:max-w-[300px]">{file.name}</p>
                <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>
            {!uploading && !success && (
              <Button variant="ghost" size="icon" onClick={() => setFile(null)}>
                <X className="w-4 h-4" />
              </Button>
            )}
            {success && <CheckCircle className="w-5 h-5 text-green-500" />}
          </div>
          
          {uploading && (
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-xs">
                <span>Uploading...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {!success ? (
            <Button 
              className="w-full" 
              onClick={uploadFile} 
              disabled={uploading}
            >
              {uploading ? "Uploading..." : "Upload & Process"}
            </Button>
          ) : (
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => {
                setFile(null);
                setSuccess(false);
                setProgress(0);
              }}
            >
              Upload Another File
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
