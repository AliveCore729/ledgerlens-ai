"use client";

import { useCallback, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, File as FileIcon, X, CheckCircle, Loader2, Bot, Database, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { uploadService } from "@/services/upload-service";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

const PROCESSING_STEPS = [
  { id: "upload", label: "Uploading securely...", icon: UploadCloud },
  { id: "parse", label: "Parsing document structure...", icon: Database },
  { id: "extract", label: "Extracting transactions...", icon: FileIcon },
  { id: "ai", label: "Running AI categorization...", icon: Bot },
  { id: "reconcile", label: "Reconciling balances...", icon: Sparkles },
];

export function UploadZone() {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "uploading" | "processing" | "success">("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const router = useRouter();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setStatus("idle");
      setUploadProgress(0);
      setCurrentStepIndex(0);
      setPassword("");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "text/csv": [".csv"],
      "application/vnd.ms-excel": [".xls", ".xlsx"],
    },
    maxFiles: 1,
  });

  const handleUploadAndProcess = async () => {
    if (!file) return;

    setStatus("uploading");
    
    try {
      // 1. Actual Upload
      const response = await uploadService.uploadStatement(file, password, (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / (progressEvent.total || file.size)
        );
        setUploadProgress(percentCompleted);
      });

      const statementId = response.statement.id;

      // 2. We don't poll anymore. We are now totally asynchronous!
      setStatus("success");
      toast.success("Statement queued for background processing!");
      
      // Redirect to statements dashboard after 3 seconds so they can see the notification
      setTimeout(() => {
        router.push("/dashboard/statements");
      }, 3000);

    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || error?.response?.data?.message || "Failed to process the statement. Please try again.");
      setStatus("idle");
    }
  };

  const removeFile = () => {
    setFile(null);
    setPassword("");
    setStatus("idle");
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <AnimatePresence mode="wait">
        {!file ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200 ${
                isDragActive 
                  ? "border-primary bg-primary/5 scale-[1.02]" 
                  : "border-border hover:border-primary/50 hover:bg-muted/50"
              }`}
            >
              <input {...getInputProps()} />
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <UploadCloud className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Drag & drop your statement</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                Securely upload your bank statements. We support PDF, CSV, and Excel formats up to 50MB.
              </p>
              <Button variant="secondary" className="px-8">Browse Files</Button>
              <div className="mt-6 text-xs text-muted-foreground bg-primary/5 border border-primary/10 rounded-lg p-3 max-w-sm mx-auto text-left">
                <span className="font-semibold text-primary block mb-1">💡 Pro Tip for 100% Accuracy:</span>
                While our AI is highly accurate with PDFs, uploading your statement directly as a <strong>.csv</strong> or <strong>.xlsx</strong> file from your bank guarantees flawless number extraction!
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="processing-card"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="border rounded-xl p-6 bg-card shadow-sm overflow-hidden relative"
          >
            {/* Background glowing effect during processing */}
            {status === "processing" && (
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 via-primary to-emerald-400 animate-[shimmer_2s_linear_infinite] bg-[length:200%_100%]" />
            )}

            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-lg flex items-center justify-center ${
                  status === "success" ? "bg-emerald-500/10 text-emerald-500" : "bg-primary/10 text-primary"
                }`}>
                  {status === "success" ? <CheckCircle className="w-6 h-6" /> : <FileIcon className="w-6 h-6" />}
                </div>
                <div>
                  <p className="font-medium text-sm truncate max-w-[200px] sm:max-w-[300px]">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              {status === "idle" && (
                <Button variant="ghost" size="icon" onClick={removeFile} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            
            {status === "uploading" && (
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm font-medium">
                  <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Uploading securely...</span>
                  <span className="text-primary">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2 bg-muted" />
              </div>
            )}

            {status === "processing" && (
              <div className="space-y-6 mb-6">
                <div className="flex flex-col gap-4">
                  {PROCESSING_STEPS.map((step, idx) => {
                    const isCompleted = idx < currentStepIndex;
                    const isActive = idx === currentStepIndex;
                    const isPending = idx > currentStepIndex;
                    
                    return (
                      <div key={step.id} className={`flex items-center gap-3 transition-opacity duration-300 ${isPending ? 'opacity-40' : 'opacity-100'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                          isCompleted ? 'bg-emerald-500/10 text-emerald-500' :
                          isActive ? 'bg-primary/10 text-primary' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {isCompleted ? <CheckCircle className="w-4 h-4" /> : 
                           isActive ? <Loader2 className="w-4 h-4 animate-spin" /> :
                           <step.icon className="w-4 h-4" />}
                        </div>
                        <span className={`text-sm font-medium ${isActive ? 'text-primary' : isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {status === "success" && (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8 text-emerald-500" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Thanks for uploading!</h3>
                <p className="text-sm text-muted-foreground mb-4">Your statement is queued for AI processing. We'll automatically categorize your transactions in the background (usually takes 1-2 minutes). You can leave this page!</p>
                <p className="text-xs text-muted-foreground">Redirecting to dashboard...</p>
              </div>
            )}

            {status === "idle" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium text-muted-foreground">
                    File Password (Optional)
                  </label>
                  <input
                    id="password"
                    type="password"
                    placeholder="e.g. Account Number (If PDF is locked)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <p className="text-xs text-muted-foreground">
                    Your password is only used once to decrypt the file and is never saved.
                  </p>
                </div>
                <Button 
                  className="w-full h-11" 
                  onClick={handleUploadAndProcess}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Upload & Extract Data
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
