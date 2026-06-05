import { UploadZone } from "@/components/UploadZone";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Banknote, FileCheck2 } from "lucide-react";

export default function UploadPage() {
  return (
    <div className="p-6 md:p-8 flex flex-col space-y-6 max-w-6xl mx-auto w-full">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Upload Statements</h1>
        <p className="text-muted-foreground mt-2">
          Upload your bank statements to extract and categorize transactions automatically.
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
        {/* Left Column - Main Upload Area */}
        <div className="col-span-1 lg:col-span-2">
          <UploadZone />
        </div>

        {/* Right Column - Info Panel */}
        <div className="col-span-1 space-y-6">
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                Secure Processing
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Your financial data is encrypted in transit and at rest using AES-256 encryption. We never share or sell your data.
              </p>
              
              <div className="pt-2 space-y-3">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-blue-500" />
                  Supported Banks
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1.5 list-disc pl-5">
                  <li>HDFC Bank</li>
                  <li>State Bank of India</li>
                  <li>ICICI Bank</li>
                  <li>Axis Bank</li>
                  <li>Kotak Mahindra</li>
                  <li>+ Most global PDF formats</li>
                </ul>
              </div>

              <div className="pt-2 space-y-3">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-purple-500" />
                  Format Requirements
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1.5 list-disc pl-5">
                  <li>Clear, unscanned PDFs</li>
                  <li>Standard CSV exports</li>
                  <li>Max file size: 50MB</li>
                  <li>Password protection removed</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
