"use client";

import { useState, useEffect } from "react";
import { Building2, Search, MoreVertical, Edit2, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { adminService } from "@/services/admin-service";
import { toast } from "sonner";

export default function OrganizationsPage() {
  const [search, setSearch] = useState("");
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrgs = async () => {
      try {
        const data = await adminService.getOrganizations();
        setOrganizations(data.map((org: any) => ({
          ...org,
          plan: org.subscription?.plan || 'Free',
          status: org.subscription?.status === 'ACTIVE' ? 'Active' : 'Past Due',
          users: org._count?.organizationUsers || 0,
          statements: org._count?.statements || 0,
          mrr: org.subscription?.status === 'ACTIVE' ? 29 : 0 // mockup MRR logic
        })));
      } catch (error) {
        toast.error("Failed to load organizations");
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrgs();
  }, []);

  const filteredOrgs = organizations.filter(o => o.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-4 md:p-8 space-y-6 min-h-screen bg-background text-foreground">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organizations</h1>
          <p className="text-muted-foreground">Manage tenant workspaces and subscriptions.</p>
        </div>
        <Button>Add Organization</Button>
      </div>

      <div className="bg-card rounded-lg border shadow-sm p-4">
        <div className="relative max-w-sm mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search organizations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organization</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Users</TableHead>
                <TableHead className="text-right">Statements</TableHead>
                <TableHead className="text-right">MRR</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrgs.map((org) => (
                <TableRow key={org.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-md bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <span className="font-medium">{org.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={
                      org.plan === "Enterprise" ? "border-purple-500 text-purple-600 bg-purple-50 dark:bg-purple-950/30" : 
                      org.plan === "Pro" ? "border-indigo-500 text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30" : ""
                    }>
                      {org.plan}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={org.status === "Active" ? "default" : org.status === "Past Due" ? "destructive" : "secondary"} className={
                      org.status === "Active" ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 shadow-none" : ""
                    }>
                      {org.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">{org.users}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{org.statements}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(org.mrr)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem><Edit2 className="mr-2 h-4 w-4" /> Edit Details</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive"><Ban className="mr-2 h-4 w-4" /> Suspend Workspace</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
