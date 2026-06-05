"use client";

import { useState, useEffect } from "react";
import { User, Search, Mail, Shield, ShieldAlert, Key } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { adminService } from "@/services/admin-service";
import { toast } from "sonner";

export default function GlobalUsersPage() {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await adminService.getUsers();
        setUsers(data.map((u: any) => ({
          ...u,
          name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'No Name',
          org: 'Tenant Org (Coming Soon)' // Real org relation requires deeper join, skipping for now
        })));
      } catch (error) {
        toast.error("Failed to load users");
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 space-y-6 min-h-screen bg-background text-foreground">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Global Users</h1>
          <p className="text-muted-foreground">Manage all individual user accounts across the platform.</p>
        </div>
      </div>

      <div className="bg-card rounded-lg border shadow-sm p-4">
        <div className="relative max-w-sm mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or org..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>System Role</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-semibold">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {user.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-muted-foreground">{user.org}</span>
                  </TableCell>
                  <TableCell>
                    {user.role === 'SUPER_ADMIN' ? (
                      <Badge className="bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20 shadow-none border-indigo-500/20">
                        <ShieldAlert className="mr-1 h-3 w-3" /> Super Admin
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="shadow-none">User</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Key className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Send Password Reset</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Force Logout</DropdownMenuItem>
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
