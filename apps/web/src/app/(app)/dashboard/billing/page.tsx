"use client";

import { useState, useEffect } from "react";
import { CreditCard, Check, Zap, ArrowRight, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { billingService } from "@/services/billing-service";

export default function BillingPage() {
  const [sub, setSub] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSub = async () => {
      try {
        const data = await billingService.getSubscription();
        setSub(data);
      } catch (error) {
        toast.error("Failed to load subscription details.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchSub();
  }, []);

  const handleUpgrade = () => {
    toast.info("Redirecting to Stripe checkout portal...");
  };

  const planName = sub?.plan === "PRO" ? "Pro Plan" : "Basic Plan";
  const monthlyPrice = sub?.plan === "PRO" ? "$29" : "$0";
  const currentStatements = sub?.usage?.statementsProcessed || 0;
  const planLimit = sub?.usage?.statementLimit || 50;
  const usagePercentage = sub?.usage?.percentage || 0;
  const isUnlimited = sub?.usage?.isUnlimited || false;

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading subscription...</div>;
  }

  return (
    <div className="p-4 md:p-8 space-y-8 min-h-screen bg-background text-foreground max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Billing & Usage</h1>
        <p className="text-muted-foreground">Manage your subscription, payment methods, and monitor API usage.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Current Plan Overview */}
        <Card className="md:col-span-2 border-primary/20 shadow-md">
          <CardHeader className="pb-4">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  {planName} <Badge className={sub?.status === 'ACTIVE' ? "bg-emerald-500 hover:bg-emerald-600" : "bg-yellow-500"}>{sub?.status}</Badge>
                </CardTitle>
                <CardDescription className="mt-1">
                  You are currently on the {planName}, billed monthly.
                </CardDescription>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold">{monthlyPrice}<span className="text-sm text-muted-foreground font-normal">/mo</span></p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-medium">
                <span className="flex items-center gap-2 text-muted-foreground"><Activity className="h-4 w-4" /> Statements Processed This Month</span>
                <span>{isUnlimited ? 'Unlimited' : `${currentStatements} / ${planLimit}`}</span>
              </div>
              {!isUnlimited && <Progress value={usagePercentage} className="h-3" />}
              <p className="text-xs text-muted-foreground">Your usage resets on the 1st of next month.</p>
            </div>
          </CardContent>
          <CardFooter className="bg-muted/30 pt-4 flex gap-4 border-t">
            <Button variant="outline">Manage Subscription</Button>
            <Button variant="outline">View Invoices</Button>
          </CardFooter>
        </Card>

        {/* Payment Method */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Payment Method</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 p-4 border rounded-lg bg-card">
              <div className="h-10 w-14 bg-muted rounded flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-sm">Visa ending in 4242</p>
                <p className="text-xs text-muted-foreground">Expires 12/2028</p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="ghost" className="w-full text-primary">Update Payment Method <ArrowRight className="ml-2 h-4 w-4" /></Button>
          </CardFooter>
        </Card>
      </div>

      {/* Upgrade Call to Action */}
      {!isUnlimited && (
        <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-5 w-5 text-yellow-500 fill-yellow-500" />
              <CardTitle>Need more capacity?</CardTitle>
            </div>
            <CardDescription>
              Upgrade to the Pro plan for unlimited statement uploads and premium support.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="grid sm:grid-cols-2 gap-3 mb-6">
              {["Unlimited statement processing", "Custom categorizer rules", "Priority 24/7 Support"].map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm font-medium">
                  <Check className="h-4 w-4 text-emerald-500" /> {feature}
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button onClick={handleUpgrade} className="bg-primary text-primary-foreground">
              Upgrade to Pro
            </Button>
          </CardFooter>
        </Card>
      )}

    </div>
  );
}
