import { UploadZone } from "@/components/UploadZone";

export default function UploadPage() {
  return (
    <div className="p-6 md:p-8 flex flex-col space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Upload Statements</h1>
        <p className="text-muted-foreground mt-2">
          Upload your bank statements to extract and categorize transactions automatically.
        </p>
      </div>
      
      <div className="py-8">
        <UploadZone />
      </div>
    </div>
  );
}
