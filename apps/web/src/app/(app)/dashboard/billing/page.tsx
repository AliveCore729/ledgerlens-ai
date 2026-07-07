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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { billingService } from "@/services/billing-service";
import { api } from "@/lib/api";

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

  const handleContactSupport = (subject: string) => {
    window.location.href = `mailto:support@ledgerlens.ai?subject=${encodeURIComponent(subject)}`;
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
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">Manage Subscription</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Manage Subscription</DialogTitle>
                  <DialogDescription>
                    We currently manage subscriptions manually to provide you with the best personalized support.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-4 py-4">
                  <div className="bg-muted p-4 rounded-md text-sm">
                    <p className="font-semibold mb-2">To manage your subscription, please contact us:</p>
                    <p className="text-muted-foreground mb-4">You can request to upgrade your plan, update payment methods, or cancel your subscription by reaching out to our support team.</p>
                    <p className="font-medium text-primary">support@ledgerlens.ai</p>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={() => handleContactSupport('Manage Subscription')} className="w-full sm:w-auto">
                    Email Support Team
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">View Invoices</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Invoices</DialogTitle>
                  <DialogDescription>
                    Your past invoices are available upon request. Please email our support team and we will send them to your registered email address.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="mt-4">
                  <Button onClick={() => handleContactSupport('Request Invoices')} className="w-full sm:w-auto">
                    Request Invoices
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-primary text-primary-foreground">
                  Contact Support to Upgrade
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Upgrade to Pro</DialogTitle>
                  <DialogDescription>
                    Unlock unlimited statement uploads, custom categorization rules, and priority support.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-4 py-4">
                  <div className="bg-muted p-4 rounded-md text-sm">
                    <p className="font-semibold mb-2">Ready to scale up?</p>
                    <p className="text-muted-foreground mb-4">We are currently onboarding new Pro customers manually. Please send us an email to activate your unlimited subscription immediately.</p>
                    <p className="font-medium text-primary">support@ledgerlens.ai</p>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={() => handleContactSupport('Upgrade to Pro Plan')} className="w-full sm:w-auto">
                    Email Sales Team
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardFooter>
        </Card>
      )}

    </div>
  );
}
