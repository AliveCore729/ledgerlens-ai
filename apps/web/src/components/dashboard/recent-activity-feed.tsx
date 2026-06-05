import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Bot, User, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function RecentActivityFeed() {
  const activities = [
    {
      id: 1,
      type: "upload",
      icon: FileText,
      title: "Statement Uploaded",
      description: "HDFC_May_2023.pdf was uploaded by you.",
      time: "2 hours ago",
      color: "text-blue-500",
      bg: "bg-blue-500/10"
    },
    {
      id: 2,
      type: "ai",
      icon: Bot,
      title: "Categorization Complete",
      description: "LedgerLens AI successfully categorized 142 transactions.",
      time: "2 hours ago",
      color: "text-emerald-500",
      bg: "bg-emerald-500/10"
    },
    {
      id: 3,
      type: "team",
      icon: User,
      title: "Team Member Added",
      description: "Sarah Jenkins joined the workspace.",
      time: "1 day ago",
      color: "text-purple-500",
      bg: "bg-purple-500/10"
    },
    {
      id: 4,
      type: "export",
      icon: ArrowRight,
      title: "Report Exported",
      description: "Q1 Tax Summary exported to CSV.",
      time: "3 days ago",
      color: "text-amber-500",
      bg: "bg-amber-500/10"
    }
  ];

  return (
    <Card className="h-full border-border bg-card shadow-sm">
      <CardHeader className="pb-3 border-b flex flex-row justify-between items-center">
        <CardTitle className="text-lg font-semibold">
          Recent Activity
        </CardTitle>
        <Link href="/dashboard/transactions" className="text-sm text-primary hover:underline font-medium">
          View all
        </Link>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
          {activities.map((activity) => (
            <div key={activity.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-background ${activity.bg} ${activity.color} shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-[0_0_0_1px_rgba(255,255,255,0.05)] z-10 ml-0 md:mx-auto`}>
                <activity.icon className="h-4 w-4" />
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-card border border-border p-3 rounded-lg shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-semibold">{activity.title}</h4>
                  <span className="text-[10px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{activity.time}</span>
                </div>
                <p className="text-xs text-muted-foreground">{activity.description}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
