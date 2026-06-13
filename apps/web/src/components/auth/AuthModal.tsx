"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { useGoogleLogin } from "@react-oauth/google";
import { toast } from "sonner";
import { authService } from "@/services/auth-service";
import { useAuthStore } from "@/store/auth-store";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";

export default function AuthModal() {
  const router = useRouter();
  const { isAuthModalOpen, closeAuthModal, setToken, setUser, user } = useAuthStore();
  const [status, setStatus] = React.useState<"idle" | "processing" | "success" | "expanding" | "revealing">("idle");
  const [agreedToTerms, setAgreedToTerms] = React.useState(false);

  // Reset status when modal opens
  React.useEffect(() => {
    if (isAuthModalOpen) {
      setStatus("idle");
    }
  }, [isAuthModalOpen]);

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setStatus("processing");
      try {
        const response = await authService.google(tokenResponse.access_token);
        
        if (response.accessToken) {
          setToken(response.accessToken);
          setUser({
            id: response.user?.id || "user-id",
            email: response.user?.email || "user@example.com",
            name: `${response.user?.firstName || ""} ${response.user?.lastName || ""}`.trim() || "User",
            role: response.user?.role || "USER",
          });
          
          setStatus("success");
          toast.success("Successfully logged in!");
          
          // Phase 1: Zip right
          setTimeout(() => {
            setStatus("expanding");
            
            // Stealth redirect while overlay expands
            setTimeout(() => {
              router.push("/dashboard");
            }, 400);

            // Phase 2: Reveal dashboard
            setTimeout(() => {
              setStatus("revealing");
              
              // Unmount entirely
              setTimeout(() => {
                closeAuthModal();
              }, 800);
            }, 2000); // Time to read "Welcome"
          }, 900); // 0.4s circle shrink + 0.5s zip right
          
        } else {
          setStatus("idle");
          toast.error("Login failed. No token received.");
        }
      } catch (error: any) {
        console.error("Login error:", error);
        setStatus("idle");
        toast.error(error?.response?.data?.message || "Invalid credentials. Please try again.");
      }
    },
    onError: () => {
      setStatus("idle");
      toast.error("Google login failed");
    },
    onNonOAuthError: () => {
      // User closed the popup window
      setStatus("idle");
    }
  });

  const handleCustomGoogleClick = () => {
    setStatus("processing");
    login();
  };

  return (
    <AnimatePresence>
      {isAuthModalOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={status === "idle" ? closeAuthModal : undefined}
            className="fixed inset-0 z-[100] bg-black/80"
          />

          {/* Welcome Text Overlay - renders on top of the expanded button */}
          <AnimatePresence>
            {(status === "expanding" || status === "revealing") && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ 
                  opacity: 1, 
                  scale: status === "revealing" ? 0.5 : 1,
                  x: status === "revealing" ? "-100vw" : 0
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none"
              >
                <h1 className="text-5xl md:text-7xl text-white tracking-tight drop-shadow-2xl" style={{ fontFamily: '"Instrument Serif", serif' }}>
                  Welcome, {user?.name?.split(' ')[0] || "User"}
                </h1>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Modal Container */}
          <div className="fixed inset-0 z-[101] flex items-center justify-center pointer-events-none p-4">
            <motion.div
              // Originates from top-right and swoops in
              initial={{ scale: 0.4, opacity: 0, x: "20vw", y: "-20vh" }}
              animate={
                status === "revealing" 
                  ? { opacity: 0, transition: { duration: 0.3 } } // Fade out modal behind the button
                  : { scale: 1, opacity: 1, x: 0, y: 0 }
              }
              exit={{ scale: 0.9, opacity: 0, y: 20, x: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              className={`pointer-events-auto relative rounded-[2rem] bg-[#050505] shadow-2xl flex flex-col items-center justify-center p-10 text-center border border-white/10 ${status === "expanding" || status === "revealing" ? "overflow-visible" : "overflow-hidden"}`}
              style={{ width: "420px", height: "320px" }}
            >
              {/* Subtle background gradient - changed to native CSS radial for performance */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(48,84,255,0.1)_0%,transparent_100%)] pointer-events-none"></div>

              {/* Close Button and Titles - Fades out on processing/success */}
              <AnimatePresence>
                {status === "idle" && (
                  <>
                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      onClick={closeAuthModal}
                      className="absolute top-4 right-4 p-2 text-white/40 hover:text-white transition-colors z-10"
                    >
                      <X className="w-5 h-5" />
                    </motion.button>
                    
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="absolute top-16 w-full text-center z-10"
                    >
                      <h2 className="text-4xl tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-white/70" style={{ fontFamily: '"Instrument Serif", serif', fontWeight: 400 }}>
                        LedgerLens
                      </h2>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>

              {/* The Action Button */}
              <div className="relative z-10 flex items-center justify-center w-full h-full mt-12">
                <motion.button
                  onClick={status === "idle" ? handleCustomGoogleClick : undefined}
                  initial={{
                    width: "100%",
                    height: "48px",
                    borderRadius: "9999px",
                    x: 0,
                    scale: 1,
                    backgroundColor: "#ffffff"
                  }}
                  animate={
                    status === "revealing"
                      ? {
                          scale: 0.5,
                          x: "-100vw", // Slide left out of the way
                          backgroundColor: "#050505"
                        }
                    : status === "expanding"
                      ? {
                          scale: 100, // Blow up to cover screen
                          x: "10vw", // Expand from slightly right
                          backgroundColor: "#050505" // Turn dark
                        }
                    : status === "success"
                      ? {
                          width: "48px",
                          height: "48px",
                          borderRadius: "50%",
                          x: "30vw", // Zip right
                          backgroundColor: "#ffffff",
                          scale: 1
                        }
                      : {
                          width: "100%",
                          height: "48px",
                          borderRadius: "9999px",
                          x: 0,
                          backgroundColor: "#ffffff",
                          scale: 1
                        }
                  }
                  transition={
                    status === "revealing"
                    ? { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
                    : status === "expanding"
                    ? { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
                    : status === "success" 
                    ? {
                        width: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
                        height: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
                        borderRadius: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
                        x: { duration: 0.5, ease: "backIn", delay: 0.4 }, // Wait for circle to form, then zip
                      }
                    : { type: "spring", stiffness: 250, damping: 25, mass: 0.5 }
                  }
                  className="flex items-center justify-center whitespace-nowrap shadow-md text-black font-medium relative group hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ zIndex: status === "expanding" || status === "revealing" ? 150 : 10 }}
                  disabled={status !== "idle" || !agreedToTerms}
                >
                  <AnimatePresence>
                    {status !== "expanding" && status !== "revealing" && (
                      <motion.div 
                        initial={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0 }}
                        className="flex items-center justify-center absolute left-0 w-[48px] h-[48px]"
                      >
                        {/* Standard Google Logo SVG */}
                        <svg viewBox="0 0 24 24" className="w-5 h-5">
                          <path
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            fill="#4285F4"
                          />
                          <path
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            fill="#34A853"
                          />
                          <path
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            fill="#FBBC05"
                          />
                          <path
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            fill="#EA4335"
                          />
                        </svg>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  <AnimatePresence mode="wait">
                    {status === "idle" && (
                      <motion.span
                        key="idle"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10, position: "absolute" }}
                        className="pl-8" // Padding to avoid logo
                        style={{ fontFamily: '"Instrument Sans", sans-serif' }}
                      >
                        Sign in with Google
                      </motion.span>
                    )}
                    {status === "processing" && (
                      <motion.span
                        key="processing"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0, position: "absolute" }}
                        className="pl-8 animate-pulse text-[#3054ff]"
                        style={{ fontFamily: '"Instrument Sans", sans-serif' }}
                      >
                        Authenticating...
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              </div>

              {/* T&C - Fades out on processing/success */}
              <AnimatePresence>
                {status === "idle" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute bottom-6 z-10 flex items-start space-x-2 text-left max-w-[280px]"
                  >
                    <Checkbox 
                      id="modal-terms" 
                      checked={agreedToTerms}
                      onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                      className="mt-0.5 border-white/40 data-[state=checked]:bg-white data-[state=checked]:text-black"
                    />
                    <label htmlFor="modal-terms" className="text-[11px] text-white/50 leading-relaxed cursor-pointer hover:text-white/80 transition-colors">
                      I agree to the <Link href="/terms" onClick={closeAuthModal} className="underline hover:text-white">Terms of Service</Link> and acknowledge the <Link href="/privacy" onClick={closeAuthModal} className="underline hover:text-white">Privacy Policy</Link> (including AI data processing).
                    </label>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
