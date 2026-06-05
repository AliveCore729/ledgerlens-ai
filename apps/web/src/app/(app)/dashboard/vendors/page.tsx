"use client";

import { useState, useEffect } from "react";
import { Search, Building2, Store, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

const CATEGORIES = [
  "Income", "Food & Dining", "Travel & Transportation", 
  "Software & Subscriptions", "Utilities & Bills", "Rent & Housing", 
  "Salary & Payroll", "Office Supplies", "Marketing & Advertising", 
  "Bank Fees & Charges", "Transfers & Investments", "Healthcare & Insurance", 
  "Shopping & Retail", "Entertainment & Leisure", "Taxes & Fines", "Misc"
];

const CATEGORY_COLORS: Record<string, string> = {
  "Income": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  "Food & Dining": "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400",
  "Travel & Transportation": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  "Software & Subscriptions": "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
  "Utilities & Bills": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  "Rent & Housing": "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  "Salary & Payroll": "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  "Office Supplies": "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  "Marketing & Advertising": "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400",
  "Bank Fees & Charges": "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  "Transfers & Investments": "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
  "Healthcare & Insurance": "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400",
  "Shopping & Retail": "bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900/30 dark:text-fuchsia-400",
  "Entertainment & Leisure": "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400",
  "Taxes & Fines": "bg-slate-700 text-slate-100 dark:bg-slate-300 dark:text-slate-900",
  "Misc": "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400",
};

import { vendorsService } from "@/services/vendors-service";

export default function VendorsPage() {
  const [search, setSearch] = useState("");
  const [vendors, setVendors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchVendors = async () => {
    try {
      const data = await vendorsService.getVendors();
      setVendors(data);
    } catch (error) {
      toast.error("Failed to fetch vendors");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const filteredVendors = vendors.filter((v) => v.name.toLowerCase().includes(search.toLowerCase()));

  const handleCategoryChange = async (vendorId: string, newCategory: string) => {
    try {
      await vendorsService.updateCategory(vendorId, newCategory);
      setVendors(vendors.map(v => v.id === vendorId ? { ...v, category: newCategory } : v));
      toast.success("Vendor mapping updated. Future transactions will use this category.");
    } catch (error) {
      toast.error("Failed to update vendor category");
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 min-h-screen bg-background text-foreground">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vendor Management</h1>
          <p className="text-muted-foreground">Manage how the AI automatically categorizes your frequent vendors.</p>
        </div>
      </div>

      <div className="bg-card rounded-lg border shadow-sm p-4">
        <div className="relative max-w-sm mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search vendors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor</TableHead>
                <TableHead>Default Category</TableHead>
                <TableHead className="text-right">Transactions</TableHead>
                <TableHead className="text-right">Total Spend</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVendors.map((vendor) => (
                <TableRow key={vendor.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center text-secondary-foreground">
                        {vendor.name.toLowerCase().includes("aws") || vendor.name.toLowerCase().includes("google") ? (
                          <Building2 className="h-5 w-5" />
                        ) : (
                          <Store className="h-5 w-5" />
                        )}
                      </div>
                      <span className="font-medium text-base">{vendor.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select
                      defaultValue={vendor.defaultCategory}
                      onValueChange={(val) => handleCategoryChange(vendor.id, val)}
                    >
                      <SelectTrigger className="w-[200px] h-8 border-transparent hover:border-border transition-colors group">
                        <div className="flex items-center gap-2">
                          <Badge className={`border-none ${CATEGORY_COLORS[vendor.defaultCategory] || CATEGORY_COLORS.Misc}`}>
                            {vendor.defaultCategory}
                          </Badge>
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {vendor.totalTransactions}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(vendor.totalSpend)}
                  </TableCell>
                </TableRow>
              ))}
              {filteredVendors.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    No vendors found matching your search.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
