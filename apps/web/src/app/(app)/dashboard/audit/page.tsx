"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { auditService } from "@/services/audit-service";
import { Button } from "@/components/ui/button";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const data = await auditService.getLogs();
      setLogs(data);
    } catch (error) {
      toast.error("Failed to load audit logs.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="p-4 md:p-8 space-y-8 min-h-screen bg-background text-foreground">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
          <p className="text-muted-foreground">Monitor security events and system access logs.</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchLogs} disabled={isLoading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            A chronological log of all actions taken within this workspace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && logs.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">Loading logs...</div>
          ) : logs.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <ShieldAlert className="h-12 w-12 text-muted-foreground opacity-20 mb-4" />
              <p className="text-muted-foreground font-medium">No audit logs found</p>
              <p className="text-sm text-muted-foreground mt-1">Actions taken by users will appear here.</p>
            </div>
          ) : (
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b">
                  <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Date</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">User</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Action</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Resource</th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                      <td className="p-4 align-middle whitespace-nowrap text-muted-foreground">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="p-4 align-middle">
                        {log.user.firstName} {log.user.lastName} <br />
                        <span className="text-xs text-muted-foreground">{log.user.email}</span>
                      </td>
                      <td className="p-4 align-middle font-medium">
                        {log.action}
                      </td>
                      <td className="p-4 align-middle text-muted-foreground">
                        {log.resource}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
