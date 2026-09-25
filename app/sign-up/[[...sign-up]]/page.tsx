import { SignUp } from '@clerk/nextjs'
import Link from 'next/link'
import { ArrowLeft, Sparkles } from 'lucide-react'

export default function SignUpPage() {
  return <main className="auth-stage auth-stage-signup"><Link href="/" className="auth-brand"><span><Sparkles className="size-4" /></span> Singapore Club</Link><div className="auth-layout"><section className="auth-panel auth-panel-copy"><Link href="/" className="auth-back"><ArrowLeft className="size-4" /> Back to home</Link><div className="auth-message"><p className="eyebrow">Start with clarity</p><h1>Give every shift a better signal.</h1><p>Create your Singapore Club workspace and bring orders, stock, tables, staff, and reporting into one calm command center.</p></div><div className="auth-dots"><span /><span /><span /></div></section><section className="auth-panel auth-panel-form"><div className="auth-copy"><p className="eyebrow">Your workspace</p><h2>Create account</h2><p>Start building a more reliable operation.</p></div><SignUp fallbackRedirectUrl="/dashboard" appearance={{elements:{rootBox:'w-full',card:'auth-clerk-card',headerTitle:'text-foreground',headerSubtitle:'text-muted-foreground',formButtonPrimary:'bg-primary hover:bg-primary/90',footerActionLink:'text-foreground'}}} /></section></div></main>
}

