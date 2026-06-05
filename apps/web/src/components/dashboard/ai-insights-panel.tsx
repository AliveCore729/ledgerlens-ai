import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, TrendingUp, AlertTriangle, Lightbulb } from "lucide-react";

export default function AiInsightsPanel() {
  const insights = [
    {
      id: 1,
      type: "opportunity",
      icon: TrendingUp,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      title: "Subscription Optimization",
      description: "You have 3 overlapping SaaS subscriptions. Consolidating them could save ₹15,000/yr."
    },
    {
      id: 2,
      type: "alert",
      icon: AlertTriangle,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      title: "Unusual Expense Spike",
      description: "AWS billing increased by 45% this month compared to the last 3 months average."
    },
    {
      id: 3,
      type: "insight",
      icon: Lightbulb,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      title: "Tax Deductible Discovery",
      description: "Found 12 uncategorized transactions that likely qualify for Section 37(1) deductions."
    }
  ];

  return (
    <Card className="h-full border-border bg-card shadow-sm">
      <CardHeader className="pb-3 border-b">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <Sparkles className="h-5 w-5 text-indigo-500" />
          AI Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {insights.map((insight) => (
          <div key={insight.id} className="flex gap-4 items-start p-3 rounded-lg hover:bg-muted/50 transition-colors">
            <div className={`mt-0.5 shrink-0 p-2 rounded-full ${insight.bg}`}>
              <insight.icon className={`h-4 w-4 ${insight.color}`} />
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-1">{insight.title}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {insight.description}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
