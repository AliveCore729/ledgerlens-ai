"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Settings, User, Building2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth-store";
import { settingsService } from "@/services/settings-service";

export default function SettingsPage() {
  const user = useAuthStore((state) => state.user);
  
  const [activeTab, setActiveTab] = useState("profile");
  
  // Profile state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Workspace state
  const [workspaceName, setWorkspaceName] = useState("");
  const [isSavingWorkspace, setIsSavingWorkspace] = useState(false);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
      setWorkspaceName(user.organizationName || "");
    }
  }, [user]);

  const handleSaveProfile = async () => {
    try {
      setIsSavingProfile(true);
      await settingsService.updateProfile({ firstName, lastName });
      
      // Update the auth store context
      if (user) {
        useAuthStore.getState().setUser({
          ...user,
          firstName,
          lastName,
          name: `${firstName} ${lastName}`.trim(),
        });
      }
      
      toast.success("Profile updated successfully!");
    } catch (error) {
      toast.error("Failed to update profile.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSaveWorkspace = async () => {
    try {
      setIsSavingWorkspace(true);
      await settingsService.updateWorkspace({ name: workspaceName });
      
      // Update the auth store context
      if (user) {
        useAuthStore.getState().setUser({
          ...user,
          organizationName: workspaceName,
        });
      }
      
      toast.success("Workspace updated successfully!");
    } catch (error) {
      toast.error("Failed to update workspace.");
    } finally {
      setIsSavingWorkspace(false);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-8 h-full bg-background text-foreground">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Manage your workspace preferences and profile.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <aside className="md:w-1/4">
          <nav className="flex flex-col space-y-1">
            <Button
              variant={activeTab === "profile" ? "secondary" : "ghost"}
              className="justify-start"
              onClick={() => setActiveTab("profile")}
            >
              <User className="mr-2 h-4 w-4" />
              My Profile
            </Button>
            <Button
              variant={activeTab === "workspace" ? "secondary" : "ghost"}
              className="justify-start"
              onClick={() => setActiveTab("workspace")}
            >
              <Building2 className="mr-2 h-4 w-4" />
              Workspace
            </Button>
          </nav>
        </aside>

        <main className="flex-1">
          {activeTab === "profile" && (
            <Card>
              <CardHeader>
                <CardTitle>Profile Details</CardTitle>
                <CardDescription>
                  Update your personal information.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" value={user?.email || ""} disabled />
                  <p className="text-[0.8rem] text-muted-foreground">Your email cannot be changed.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSaveProfile} disabled={isSavingProfile}>
                  {isSavingProfile ? "Saving..." : "Save Changes"}
                </Button>
              </CardFooter>
            </Card>
          )}

          {activeTab === "workspace" && (
            <Card>
              <CardHeader>
                <CardTitle>Workspace Settings</CardTitle>
                <CardDescription>
                  Manage the details of your organization workspace.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="workspaceName">Workspace Name</Label>
                  <Input id="workspaceName" value={workspaceName} onChange={(e) => setWorkspaceName(e.target.value)} />
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSaveWorkspace} disabled={isSavingWorkspace}>
                  {isSavingWorkspace ? "Saving..." : "Save Changes"}
                </Button>
              </CardFooter>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}
