"use client";

import { useState } from "react";
import { Check, ChevronDown, Wand2, Sparkles, Folder, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { 
  useCategorizationSummary, 
  useReviewTransaction, 
} from "@/hooks/useTransactions";

const CATEGORIES = [
  "Income", "Food & Dining", "Travel & Transportation", 
  "Software & Subscriptions", "Utilities & Bills", "Rent & Housing", 
  "Salary & Payroll", "Office Supplies", "Marketing & Advertising", 
  "Bank Fees & Charges", "Transfers & Investments", "Healthcare & Insurance", 
  "Shopping & Retail", "Entertainment & Leisure", "Taxes & Fines", "Misc",
  "UNCATEGORIZED"
];

const CATEGORY_COLORS: Record<string, string> = {
  "Income": "bg-green-100 text-green-800",
  "Food & Dining": "bg-pink-100 text-pink-800",
  "Travel & Transportation": "bg-blue-100 text-blue-800",
  "Software & Subscriptions": "bg-indigo-100 text-indigo-800",
  "Utilities & Bills": "bg-yellow-100 text-yellow-800",
  "Rent & Housing": "bg-purple-100 text-purple-800",
  "Salary & Payroll": "bg-emerald-100 text-emerald-800",
  "Office Supplies": "bg-orange-100 text-orange-800",
  "Marketing & Advertising": "bg-teal-100 text-teal-800",
  "Bank Fees & Charges": "bg-red-100 text-red-800",
  "Transfers & Investments": "bg-cyan-100 text-cyan-800",
  "Healthcare & Insurance": "bg-rose-100 text-rose-800",
  "Shopping & Retail": "bg-fuchsia-100 text-fuchsia-800",
  "Entertainment & Leisure": "bg-violet-100 text-violet-800",
  "Taxes & Fines": "bg-slate-700 text-slate-100",
  "Misc": "bg-slate-100 text-slate-800",
  "UNCATEGORIZED": "bg-gray-100 text-gray-800 border border-gray-200",
};

export default function CategorizationPage() {
  const { data: summaries = [], isLoading } = useCategorizationSummary();
  const reviewMutation = useReviewTransaction();

  const handleApprove = (id: string) => {
    reviewMutation.mutate({ id }, {
      onSuccess: () => toast.success("Transaction approved")
    });
  };

  const handleUpdateCategory = (id: string, category: string) => {
    reviewMutation.mutate({ id, category }, {
      onSuccess: () => toast.success("Category updated")
    });
  };

  return (
    <div className="p-4 md:p-8 space-y-6 min-h-screen bg-background text-foreground">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Folder className="h-8 w-8 text-indigo-500" />
            Categorization
          </h1>
          <p className="text-muted-foreground mt-1">
            Review your spending broken down by category and verify AI classifications.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-32 bg-secondary rounded-lg border shadow-sm"></div>
          ))}
        </div>
      ) : summaries.length === 0 ? (
        <div className="bg-card rounded-lg border shadow-sm p-12 text-center flex flex-col items-center">
          <div className="h-16 w-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
            <FileText className="h-8 w-8 text-blue-500" />
          </div>
          <h3 className="text-lg font-medium">No Transactions Yet</h3>
          <p className="text-muted-foreground mt-1">Upload a statement to see categorization breakdown.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          <Accordion type="multiple" className="w-full space-y-4">
            {summaries.map((summary) => (
              <AccordionItem 
                key={summary.category} 
                value={summary.category}
                className="bg-card border rounded-lg shadow-sm px-4 overflow-hidden"
              >
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center justify-between w-full pr-4">
                    <div className="flex items-center gap-3">
                      <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${CATEGORY_COLORS[summary.category] || CATEGORY_COLORS.Misc}`}>
                        <Folder className="h-6 w-6 opacity-75" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-semibold text-lg">{summary.category}</h3>
                        <p className="text-sm text-muted-foreground">
                          {summary.transactionCount} transaction{summary.transactionCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground mb-1">Total Spend</p>
                      <p className="font-bold text-lg text-foreground">
                        {summary.category === "Income" ? "+" : ""}{formatCurrency(summary.totalSpend)}
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-6">
                  <div className="rounded-md border overflow-hidden bg-background">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead>Date</TableHead>
                          <TableHead>Vendor / Description</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {summary.transactions.map((tx) => (
                          <TableRow key={tx.id} className="group">
                            <TableCell className="whitespace-nowrap text-muted-foreground">
                              {tx.date}
                            </TableCell>
                            <TableCell>
                              <p className="font-medium">{tx.vendor || "Unknown Vendor"}</p>
                              <p className="text-xs text-muted-foreground truncate max-w-[200px] md:max-w-xs" title={tx.narration}>
                                {tx.narration}
                              </p>
                            </TableCell>
                            <TableCell className={`text-right font-medium ${tx.type === 'CR' ? 'text-green-600' : ''}`}>
                              {tx.type === 'CR' ? '+' : '-'}{formatCurrency(tx.amount)}
                            </TableCell>
                            <TableCell>
                              {(tx as any).isReviewed ? (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1">
                                  <Check className="h-3 w-3" /> Reviewed
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="gap-1">
                                  <Wand2 className="h-3 w-3" /> AI Assigned
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm">
                                      Edit Category <ChevronDown className="ml-1 h-3 w-3" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="max-h-[300px] overflow-y-auto">
                                    {CATEGORIES.map(cat => (
                                      <DropdownMenuItem key={cat} onClick={() => handleUpdateCategory(tx.id, cat)}>
                                        {cat}
                                      </DropdownMenuItem>
                                    ))}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                                
                                {!(tx as any).isReviewed && (
                                  <Button size="sm" variant="ghost" className="text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => handleApprove(tx.id)}>
                                    <Check className="mr-1 h-4 w-4" />
                                    Approve
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      )}
    </div>
  );
}
