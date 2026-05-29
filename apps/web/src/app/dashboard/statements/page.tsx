'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { FileText, ArrowRight, BarChart3 } from 'lucide-react';
import { useStatements } from '@/hooks/useStatements';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import UploadPanel from '@/components/dashboard/upload-panel';

export default function StatementsPage() {
  const { data: statements, isLoading } = useStatements();

  return (
    <div className="p-4 md:p-8 space-y-6 min-h-screen bg-background text-foreground">
      <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Statement Library</h1>
          <p className="text-muted-foreground">Manage and analyze your uploaded bank statements.</p>
        </div>
        <UploadPanel />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="shadow-sm">
              <CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader>
              <CardContent><Skeleton className="h-10 w-full mt-4" /></CardContent>
            </Card>
          ))
        ) : statements?.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground bg-card rounded-lg border border-dashed">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No statements uploaded yet.</p>
          </div>
        ) : (
          statements?.map((statement) => (
            <Card key={statement.id} className="shadow-sm hover:border-primary/50 transition-colors flex flex-col justify-between">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-1 w-full overflow-hidden">
                    <CardTitle className="text-base truncate" title={statement.originalName}>
                      {statement.originalName}
                    </CardTitle>
                    <CardDescription>
                      Uploaded {statement.uploadedAt ? format(new Date(statement.uploadedAt), 'MMM dd, yyyy') : 'Unknown date'}
                    </CardDescription>
                  </div>
                  <div className="bg-primary/10 p-2 rounded-md ml-2 shrink-0">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 flex flex-col gap-4">
                <div className="text-sm font-medium">
                  {statement._count?.transactions || 0} Transactions Extracted
                </div>
                <Button asChild className="w-full" variant="outline">
                  {/* Notice how this routes back to the dashboard with the ID! */}
                  <Link href={`/dashboard/transactions?statementId=${statement.id}`}>
                    <BarChart3 className="mr-2 h-4 w-4" /> View Analytics
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}