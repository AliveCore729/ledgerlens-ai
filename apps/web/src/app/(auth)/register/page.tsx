"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { authService } from "@/services/auth-service"
import { useAuthStore } from "@/store/auth-store"
import { toast } from "sonner"
import { GoogleLogin } from "@react-oauth/google"
import { Checkbox } from "@/components/ui/checkbox"

export default function RegisterPage() {
  const [isLoading, setIsLoading] = React.useState(false)
  const [agreedToTerms, setAgreedToTerms] = React.useState(false)
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
        
        toast.success("Account created successfully!")
        router.push("/dashboard")
      } else {
        toast.error("Signup failed. No token received.")
      }
    } catch (error: any) {
      console.error("Signup error:", error)
      toast.error(error?.response?.data?.message || "Failed to create account. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-sm">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Create an account</h1>
        <p className="text-sm text-muted-foreground">
          Continue with Google to get started
        </p>
      </div>
      <Card className="border-0 shadow-none bg-transparent">
        <CardContent className="flex flex-col items-center justify-center p-0 pt-4">
          <div className="flex items-center space-x-2 w-full justify-center mb-6">
            <Checkbox 
              id="terms" 
              checked={agreedToTerms} 
              onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)} 
              className="border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
            />
            <label
              htmlFor="terms"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              I agree to the Terms of Service & Privacy Policy
            </label>
          </div>

          <div className={(!agreedToTerms || isLoading) ? "opacity-50 pointer-events-none transition-opacity" : "transition-opacity"}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => {
                toast.error("Google signup failed")
              }}
              useOneTap={false} // Disable oneTap if they haven't agreed yet
              theme="filled_black"
              shape="pill"
              size="large"
            />
          </div>
          {isLoading && (
            <p className="text-sm text-muted-foreground mt-4 animate-pulse">Creating account...</p>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-4 p-0 pt-6">
          <div className="text-sm text-center text-muted-foreground">
            By clicking continue, you agree to our{" "}
            <Link href="/terms" className="underline underline-offset-4 hover:text-primary">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline underline-offset-4 hover:text-primary">
              Privacy Policy
            </Link>
            .
          </div>
          <div className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Login
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}