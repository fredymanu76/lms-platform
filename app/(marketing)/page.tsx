import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Shield, FileCheck, Zap, Users, TrendingUp } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <span className="text-xl font-semibold">Regulatory Readiness</span>
            </div>
            <nav className="hidden md:flex items-center gap-6">
              <Link href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Features
              </Link>
              <Link href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Pricing
              </Link>
              <Link href="#compliance" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Compliance
              </Link>
              <Link href="/login">
                <Button variant="ghost" size="sm">Log in</Button>
              </Link>
              <Link href="/signup">
                <Button size="sm">Get Started</Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="max-w-4xl mx-auto text-center">
          <Badge variant="secondary" className="mb-4">
            Built for FCA-regulated firms
          </Badge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 text-balance">
            Always Audit-Ready.<br />Never Caught Out.
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto text-balance">
            The compliance training platform that keeps your team skilled, your records defensible, and your regulators satisfied.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="w-full sm:w-auto">
                Start Free Trial
              </Button>
            </Link>
            <Link href="#demo">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Request Demo
              </Button>
            </Link>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </section>

      {/* Social Proof */}
      <section className="border-y border-border/40 bg-muted/30 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center justify-items-center opacity-60">
            <div className="text-center">
              <p className="text-3xl font-bold">500+</p>
              <p className="text-sm text-muted-foreground">Regulated Firms</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">50K+</p>
              <p className="text-sm text-muted-foreground">Learners</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">99.8%</p>
              <p className="text-sm text-muted-foreground">Uptime</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">100%</p>
              <p className="text-sm text-muted-foreground">Audit Pass Rate</p>
            </div>
          </div>
        </div>
      </section>

      {/* Key Outcomes */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            The Outcome You Actually Need
          </h2>
          <p className="text-lg text-muted-foreground">
            Not just training. Evidence-backed regulatory readiness.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Card className="border-border/50">
            <CardHeader>
              <FileCheck className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Audit-Ready Records</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Immutable training logs, version control, and evidence packs designed for FCA scrutiny.
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardHeader>
              <Users className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Role-Based Training Matrix</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Automated assignment by role. Track who needs what, when. Never miss a refresher.
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardHeader>
              <TrendingUp className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Policies + Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                AML, CTF, Consumer Duty templates. Customise, publish, track acknowledgements.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="bg-muted/30 py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need. Nothing You Don't.
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              { icon: Shield, title: "Content Versioning", desc: "Immutable audit trail for every course change" },
              { icon: Zap, title: "AI Authoring", desc: "Generate courses with mandatory human review" },
              { icon: FileCheck, title: "Evidence Exports", desc: "One-click PDF/CSV packs for auditors" },
              { icon: CheckCircle2, title: "Smart Assignments", desc: "Auto-assign by role, team, or department" },
              { icon: Users, title: "Multi-Tenant", desc: "Secure workspace per firm with RLS protection" },
              { icon: TrendingUp, title: "Compliance Dashboard", desc: "Overdue heatmaps and training matrices" },
            ].map((feature, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Tiers */}
      <section id="pricing" className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-muted-foreground">
            Scale as you grow. Cancel anytime.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[
            {
              name: "Starter",
              price: "£99",
              seats: "1-10 seats",
              features: ["Core compliance courses", "Training assignments", "Completion tracking", "Basic reporting", "Email support"]
            },
            {
              name: "Growth",
              price: "£299",
              seats: "11-50 seats",
              features: ["Everything in Starter", "Template library", "Evidence exports", "Training matrix", "Priority support"],
              highlighted: true
            },
            {
              name: "Pro",
              price: "£799",
              seats: "51-200 seats",
              features: ["Everything in Growth", "AI authoring", "Advanced analytics", "SSO (optional)", "Dedicated CSM"]
            },
          ].map((tier, i) => (
            <Card key={i} className={tier.highlighted ? "border-primary shadow-lg" : "border-border/50"}>
              <CardHeader>
                {tier.highlighted && (
                  <Badge className="w-fit mb-2">Most Popular</Badge>
                )}
                <CardTitle>{tier.name}</CardTitle>
                <CardDescription>{tier.seats}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{tier.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-6">
                  {tier.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button className="w-full" variant={tier.highlighted ? "default" : "outline"}>
                  Start Free Trial
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary text-primary-foreground py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Be Audit-Ready?
          </h2>
          <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto">
            Join hundreds of regulated firms who trust Regulatory Readiness for their compliance training.
          </p>
          <Link href="/signup">
            <Button size="lg" variant="secondary">
              Start Your Free Trial
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Shield className="h-5 w-5 text-primary" />
                <span className="font-semibold">Regulatory Readiness</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Modern compliance training for regulated firms.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#features">Features</Link></li>
                <li><Link href="#pricing">Pricing</Link></li>
                <li><Link href="#security">Security</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Compliance</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#aml">AML/CTF</Link></li>
                <li><Link href="#psd2">PSD2</Link></li>
                <li><Link href="#consumer-duty">Consumer Duty</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#about">About</Link></li>
                <li><Link href="#contact">Contact</Link></li>
                <li><Link href="#privacy">Privacy</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border/40 mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2025 Regulatory Readiness LMS. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
