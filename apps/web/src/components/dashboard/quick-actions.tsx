import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UploadCloud, Users, Download, Receipt } from "lucide-react";
import Link from "next/link";

export default function QuickActions() {
  const actions = [
    {
      title: "Upload Statement",
      icon: UploadCloud,
      href: "/dashboard/upload",
      variant: "default" as const,
    },
    {
      title: "Categorize Transactions",
      icon: Receipt,
      href: "/dashboard/transactions",
      variant: "outline" as const,
    },
    {
      title: "Invite Team Member",
      icon: Users,
      href: "/dashboard/team",
      variant: "outline" as const,
    },
    {
      title: "Export Tax Report",
      icon: Download,
      href: "/dashboard/reports",
      variant: "outline" as const,
    }
  ];

  return (
    <Card className="h-full border-border bg-card shadow-sm">
      <CardHeader className="pb-3 border-b">
        <CardTitle className="text-lg font-semibold">
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 flex flex-col gap-3">
        {actions.map((action, idx) => (
          <Button 
            key={idx} 
            variant={action.variant} 
            className="w-full justify-start h-11"
            asChild
          >
            <Link href={action.href}>
              <action.icon className="mr-2 h-4 w-4" />
              {action.title}
            </Link>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
