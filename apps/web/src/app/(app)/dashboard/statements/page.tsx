'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { FileText, ArrowRight, BarChart3, AlertCircle, Loader2, CheckCircle2, Trash2 } from 'lucide-react';
import { useStatements, useDeleteStatement } from '@/hooks/useStatements';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import UploadPanel from '@/components/dashboard/upload-panel';

export default function StatementsPage() {
  const { data: statements, isLoading } = useStatements();
  const { mutate: deleteStatement, isPending: isDeleting } = useDeleteStatement();

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
                  <div className="space-y-1 flex-1 min-w-0">
                    <CardTitle className="text-base truncate" title={statement.fileName}>
                      {statement.fileName}
                    </CardTitle>
                    <CardDescription>
                      Uploaded {statement.createdAt ? format(new Date(statement.createdAt), 'MMM dd, yyyy') : 'Unknown date'}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2 shrink-0 ml-2">
                    <div className="bg-primary/10 p-2 rounded-md">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this statement and all its transactions?')) {
                          deleteStatement(statement.id);
                        }
                      }}
                      disabled={isDeleting}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">
                    {statement._count?.transactions || 0} Transactions Extracted
                  </div>
                  {statement.status === 'COMPLETED' && <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Ready</Badge>}
                  {statement.status === 'FAILED' && <Badge variant="destructive" className="flex items-center gap-1"><AlertCircle className="w-3 h-3"/> Failed</Badge>}
                  {(statement.status === 'PROCESSING' || statement.status === 'PENDING') && <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin"/> Processing</Badge>}
                </div>
                <Button asChild className="w-full" variant="outline" disabled={statement.status !== 'COMPLETED'}>
                  <Link href={`/dashboard/transactions?statementId=${statement.id}`}>
                    <BarChart3 className="mr-2 h-4 w-4" /> View Transactions
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