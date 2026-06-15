'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { FileText, AlertCircle, Loader2, CheckCircle2, Trash2, ChevronRight } from 'lucide-react';
import { useStatements, useDeleteStatement } from '@/hooks/useStatements';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function StatementsPage() {
  const { data: statements, isLoading } = useStatements();
  const { mutate: deleteStatement, isPending: isDeleting } = useDeleteStatement();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Statement Library</h1>
          <p className="text-white/60">Manage and analyze your uploaded bank statements.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-3xl bg-[#131417] p-6 min-h-[160px] border border-white/5 flex flex-col justify-between">
              <Skeleton className="h-4 w-1/2 bg-white/10" />
              <Skeleton className="h-10 w-1/3 bg-white/10 mt-8" />
            </div>
          ))
        ) : statements?.length === 0 ? (
          <div className="col-span-full py-16 text-center text-white/40 bg-[#131417] rounded-3xl border border-white/5">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>No statements uploaded yet.</p>
          </div>
        ) : (
          statements?.map((statement) => (
            <Link 
              href={statement.status === 'COMPLETED' ? `/dashboard/transactions?statementId=${statement.id}` : '#'}
              key={statement.id} 
              className="relative overflow-hidden rounded-3xl bg-[#1a1b1e] border border-white/5 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 group flex flex-col justify-between p-6 min-h-[180px]"
              style={{
                boxShadow: "inset -8px 1px 13px 0px rgba(255, 84, 27, 0.4), 0px 16px 28.5px 0px rgba(0,0,0,0.5)"
              }}
            >
              {/* Glowing Blur Element */}
              <div className="absolute -right-12 -top-12 w-48 h-48 bg-[#FF541B] rounded-full blur-[74px] opacity-40 group-hover:opacity-60 transition-opacity duration-500 pointer-events-none" />
              
              <div className="relative z-10 flex justify-between items-start w-full">
                <div className="flex flex-col gap-1 max-w-[80%]">
                  <h3 className="text-white/50 text-sm font-medium tracking-wide truncate" title={statement.fileName}>
                    {statement.fileName}
                  </h3>
                  <span className="text-[10px] text-white/30 uppercase tracking-widest font-bold">
                    {statement.createdAt ? format(new Date(statement.createdAt), 'MMM dd, yyyy') : 'Unknown'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-white/30 hover:text-red-400 hover:bg-red-500/20 rounded-full shrink-0 z-20 relative transition-colors"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (confirm('Are you sure you want to delete this statement and all its transactions?')) {
                        deleteStatement(statement.id);
                      }
                    }}
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                  <ChevronRight className="h-5 w-5 text-white/40 group-hover:text-white transition-colors group-hover:translate-x-1 duration-300" />
                </div>
              </div>

              <div className="relative z-10 flex items-end justify-between mt-8">
                <div className="text-4xl font-bold text-white tracking-tight flex items-baseline gap-2" style={{ fontFamily: '"Instrument Sans", sans-serif' }}>
                  {statement._count?.transactions || 0}
                  <span className="text-sm text-white/40 font-medium tracking-normal">entries</span>
                </div>
                
                <div className="flex shrink-0">
                  {statement.status === 'COMPLETED' && <Badge className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-full px-3 py-1 text-xs shadow-none"><CheckCircle2 className="w-3 h-3 mr-1.5"/> Ready</Badge>}
                  {statement.status === 'FAILED' && <Badge className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 rounded-full px-3 py-1 text-xs shadow-none"><AlertCircle className="w-3 h-3 mr-1.5"/> Failed</Badge>}
                  {statement.status === 'DELAYED' && <Badge className="bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 border border-orange-500/20 rounded-full px-3 py-1 text-xs shadow-none"><Loader2 className="w-3 h-3 mr-1.5 animate-spin"/> Queued (High Demand)</Badge>}
                  {(statement.status === 'PROCESSING' || statement.status === 'PENDING' || statement.status === 'UPLOADED' || !statement.status) && <Badge className="bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 rounded-full px-3 py-1 text-xs shadow-none"><Loader2 className="w-3 h-3 mr-1.5 animate-spin"/> Processing</Badge>}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}