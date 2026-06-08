"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { authService } from "@/services/auth-service"
import { useAuthStore } from "@/store/auth-store"
import { toast } from "sonner"
import { GoogleLogin } from "@react-oauth/google"

export default function LoginPage() {
  const [isLoading, setIsLoading] = React.useState(false)
  const router = useRouter()
  const setToken = useAuthStore((state) => state.setToken)
  const setUser = useAuthStore((state) => state.setUser)

  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (!credentialResponse.credential) {
      toast.error("Failed to authenticate with Google")
      return;
    }

    setIsLoading(true)

    try {
      const response = await authService.google(credentialResponse.credential)
      
      // Store token and user data in Zustand
      if (response.accessToken) {
        setToken(response.accessToken)
        setUser({
          id: response.user?.id || "user-id",
          email: response.user?.email || "user@example.com",
          name: `${response.user?.firstName} ${response.user?.lastName}`.trim() || "User",
          role: response.user?.role || "USER",
        })
        
        toast.success("Successfully logged in!")
        router.push("/dashboard")
      } else {
        toast.error("Login failed. No token received.")
      }
    } catch (error: any) {
      console.error("Login error:", error)
      toast.error(error?.response?.data?.message || "Invalid credentials. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-sm">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground">
          Continue with Google to securely access your account
        </p>
      </div>
      <Card className="border-0 shadow-none bg-transparent">
        <CardContent className="flex flex-col items-center justify-center p-0 pt-4">
          <div className={isLoading ? "opacity-50 pointer-events-none" : ""}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => {
                toast.error("Google login failed")
              }}
              useOneTap
              theme="filled_black"
              shape="pill"
              size="large"
            />
          </div>
          {isLoading && (
            <p className="text-sm text-muted-foreground mt-4 animate-pulse">Authenticating...</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}