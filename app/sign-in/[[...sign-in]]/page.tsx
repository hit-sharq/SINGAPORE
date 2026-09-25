import { SignIn } from '@clerk/nextjs'
import Link from 'next/link'
import { ArrowLeft, Sparkles } from 'lucide-react'

export default function SignInPage() {
  return <main className="auth-stage auth-stage-signin"><Link href="/" className="auth-brand"><span><Sparkles className="size-4" /></span> Singapore Club</Link><div className="auth-layout"><section className="auth-panel auth-panel-copy"><Link href="/" className="auth-back"><ArrowLeft className="size-4" /> Back to home</Link><div className="auth-message"><p className="eyebrow">Welcome back</p><h1>Keep the whole club moving.</h1><p>Sign in to see your operation clearly, pick up the next task, and lead the shift with confidence.</p></div><div className="auth-dots"><span /><span /><span /></div></section><section className="auth-panel auth-panel-form"><div className="auth-copy"><p className="eyebrow">Your workspace</p><h2>Sign in</h2><p>Return to the Singapore Club dashboard.</p></div><SignIn fallbackRedirectUrl="/dashboard" appearance={{elements:{rootBox:'w-full',card:'auth-clerk-card',headerTitle:'text-foreground',headerSubtitle:'text-muted-foreground',formButtonPrimary:'bg-primary hover:bg-primary/90',footerActionLink:'text-foreground'}}} /></section></div></main>
}

