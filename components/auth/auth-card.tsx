"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { AnimatePresence, LayoutGroup, motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, Mail, Eye, EyeOff } from "lucide-react"

interface AuthCardProps {
  isLoading: boolean
  email: string
  setEmail: (email: string) => void
  password: string
  setPassword: (password: string) => void
  firstName: string
  setFirstName: (password: string) => void
  lastName: string
  setLastName: (password: string) => void
  rememberMe: boolean
  setRememberMe: (remember: boolean) => void
  onSignIn: (e: React.FormEvent) => void
  onSignUp: (e: React.FormEvent) => void
  onSocialLogin: (provider: string) => void
  onForgotPassword: () => void
}

const appleEase = [0.22, 1, 0.36, 1] as const

const panelTransition = {
  duration: 0.48,
  ease: appleEase,
}

const fieldVariants = {
  hidden: { opacity: 0, y: 10, filter: "blur(6px)" },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      delay: 0.06 + i * 0.045,
      duration: 0.42,
      ease: appleEase,
    },
  }),
  exit: {
    opacity: 0,
    y: -8,
    filter: "blur(6px)",
    transition: { duration: 0.22, ease: appleEase },
  },
}

const inputClass =
  "bg-black/20 backdrop-blur-sm border border-white/10 rounded-2xl h-14 text-white placeholder:text-white/40 focus:border-white/30 focus:ring-0 text-base transition-all duration-200 hover:bg-black/30 focus:bg-black/30"

export function AuthCard({
  isLoading,
  email,
  setEmail,
  password,
  setPassword,
  rememberMe,
  setRememberMe,
  onSignIn,
  onSignUp,
  firstName,
  setFirstName,
  lastName,
  setLastName,
  onForgotPassword,
}: AuthCardProps) {
  const [activeTab, setActiveTab] = useState<"signup" | "signin">("signup")
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="w-full max-w-md mx-auto">
      <motion.div
        layout
        transition={{ layout: { duration: 0.5, ease: appleEase } }}
        className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-[32px] p-8 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-8">
          <LayoutGroup>
            <div className="relative flex bg-black/30 backdrop-blur-sm rounded-full p-1 border border-white/10">
              {(["signup", "signin"] as const).map(tab => {
                const label = tab === "signup" ? "Sign up" : "Sign in"
                const active = activeTab === tab
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`relative z-10 px-6 py-2 rounded-full text-sm font-medium transition-colors duration-300 ${
                      active ? "text-white" : "text-white/55 hover:text-white/80"
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="auth-tab-pill"
                        className="absolute inset-0 rounded-full bg-white/20 border border-white/20 shadow-lg"
                        transition={{ type: "spring", stiffness: 420, damping: 34, mass: 0.7 }}
                      />
                    )}
                    <span className="relative z-10">{label}</span>
                  </button>
                )
              })}
            </div>
          </LayoutGroup>

          <Link
            href="/"
            aria-label="Close"
            className="w-10 h-10 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/10 hover:bg-black/40 transition-all duration-200 hover:scale-110 hover:rotate-90"
          >
            <X className="w-5 h-5 text-white/80" />
          </Link>
        </div>

        <div className="relative mb-8 h-10 overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            <motion.h1
              key={activeTab}
              initial={{ opacity: 0, y: 14, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -10, filter: "blur(8px)" }}
              transition={panelTransition}
              className="absolute inset-x-0 text-3xl font-normal text-white"
            >
              {activeTab === "signup" ? "Create an account" : "Welcome back"}
            </motion.h1>
          </AnimatePresence>
        </div>

        <motion.div layout transition={{ layout: { duration: 0.5, ease: appleEase } }} className="relative">
          <AnimatePresence mode="wait" initial={false}>
            {activeTab === "signup" ? (
              <motion.form
                key="signup"
                onSubmit={e => {
                  e.preventDefault()
                  onSignUp(e)
                }}
                initial={{ opacity: 0, scale: 0.97, filter: "blur(10px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 0.98, filter: "blur(10px)" }}
                transition={panelTransition}
                className="space-y-4 origin-top"
              >
                <motion.div
                  custom={0}
                  variants={fieldVariants}
                  initial="hidden"
                  animate="show"
                  exit="exit"
                  className="grid grid-cols-2 gap-4"
                >
                  <Input
                    type="text"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    className={inputClass}
                    placeholder="First name"
                    autoComplete="given-name"
                  />
                  <Input
                    type="text"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    className={inputClass}
                    placeholder="Last name"
                    autoComplete="family-name"
                  />
                </motion.div>

                <motion.div
                  custom={1}
                  variants={fieldVariants}
                  initial="hidden"
                  animate="show"
                  exit="exit"
                  className="relative"
                >
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <Input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className={`${inputClass} pl-12`}
                    placeholder="Enter your email"
                    autoComplete="email"
                  />
                </motion.div>

                <motion.div
                  custom={2}
                  variants={fieldVariants}
                  initial="hidden"
                  animate="show"
                  exit="exit"
                  className="relative"
                >
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className={`${inputClass} pr-12`}
                    placeholder="Enter your password"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </motion.div>

                <motion.div custom={3} variants={fieldVariants} initial="hidden" animate="show" exit="exit">
                  <Button
                    type="submit"
                    className="w-full bg-white/20 backdrop-blur-sm border border-white/20 hover:bg-white/30 text-white font-medium rounded-2xl h-14 mt-4 text-base transition-all duration-300 hover:scale-[1.01] active:scale-[0.98]"
                    disabled={isLoading}
                  >
                    {isLoading ? "Creating account..." : "Create an account"}
                  </Button>
                </motion.div>
              </motion.form>
            ) : (
              <motion.form
                key="signin"
                onSubmit={e => {
                  e.preventDefault()
                  onSignIn(e)
                }}
                initial={{ opacity: 0, scale: 0.97, filter: "blur(10px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 0.98, filter: "blur(10px)" }}
                transition={panelTransition}
                className="space-y-4 origin-top"
              >
                <motion.div
                  custom={0}
                  variants={fieldVariants}
                  initial="hidden"
                  animate="show"
                  exit="exit"
                  className="relative"
                >
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <Input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className={`${inputClass} pl-12`}
                    placeholder="Enter your email"
                    autoComplete="email"
                  />
                </motion.div>

                <motion.div
                  custom={1}
                  variants={fieldVariants}
                  initial="hidden"
                  animate="show"
                  exit="exit"
                  className="relative"
                >
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className={`${inputClass} pr-12`}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </motion.div>

                <motion.div
                  custom={2}
                  variants={fieldVariants}
                  initial="hidden"
                  animate="show"
                  exit="exit"
                  className="flex items-center justify-between"
                >
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={e => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border border-white/20 bg-black/20 text-white focus:ring-white/20 focus:ring-2"
                    />
                    <span className="text-white/60 text-sm">Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={onForgotPassword}
                    className="text-white/60 hover:text-white text-sm transition-colors"
                  >
                    Forgot password?
                  </button>
                </motion.div>

                <motion.div custom={3} variants={fieldVariants} initial="hidden" animate="show" exit="exit">
                  <Button
                    type="submit"
                    className="w-full bg-white/20 backdrop-blur-sm border border-white/20 hover:bg-white/30 text-white font-medium rounded-2xl h-14 mt-4 text-base transition-all duration-300 hover:scale-[1.01] active:scale-[0.98]"
                    disabled={isLoading}
                  >
                    {isLoading ? "Signing in..." : "Sign in"}
                  </Button>
                </motion.div>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </div>
  )
}
