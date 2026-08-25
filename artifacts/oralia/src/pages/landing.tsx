import { Link } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Globe2, MapPin, Orbit, Sparkles, Sun, Moon, Compass, ShieldCheck } from "lucide-react";

const FEATURES = [
  {
    title: "Astrocartography Map",
    description: "See the places where your chart emphasizes career, love, visibility, healing, creativity, and reinvention.",
    icon: Globe2,
  },
  {
    title: "Ranked Cities",
    description: "Sort locations by goal so you can quickly find where to launch, visit, write, rest, network, or reconnect.",
    icon: MapPin,
  },
  {
    title: "Planet Line Guidance",
    description: "Understand Sun, Moon, Venus, Jupiter, Saturn, Pluto, Chiron, Node, ASC, DSC, MC, and IC influences in plain language.",
    icon: Orbit,
  },
  {
    title: "Practical Strategy",
    description: "Turn symbolic map data into direct recommendations without treating any place as fixed fate.",
    icon: Compass,
  },
];

const BLUEPRINT = [
  "Career and visibility cities",
  "Love and relationship locations",
  "Healing, retreat, and nervous-system reset places",
  "Writing, creativity, and spiritual-growth environments",
  "Confidence labels and practical watch-outs",
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col overflow-hidden">
      <header className="relative z-10 py-6 px-6 md:px-10 flex justify-between items-center border-b border-border/70 bg-background/80 backdrop-blur-xl">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-secondary/50 text-secondary oralia-gold-glow">
            <Moon className="h-5 w-5" />
          </span>
          <span className="text-3xl font-serif font-semibold text-primary tracking-wide">Oralia</span>
        </Link>
        <div className="flex gap-3">
          <Link href="/auth">
            <Button variant="outline" className="border-primary/40 text-primary hover:bg-primary/5 rounded-full">Sign In</Button>
          </Link>
          <Link href="/auth">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-6">Start Your Map</Button>
          </Link>
        </div>
      </header>

      <main className="relative flex-1">
        <section className="relative px-6 md:px-10 py-20 md:py-28">
          <div className="absolute inset-0 pointer-events-none opacity-60">
            <div className="absolute -top-24 right-10 h-96 w-96 rounded-full border border-secondary/20" />
            <div className="absolute top-24 right-32 h-64 w-64 rounded-full border border-secondary/20" />
            <div className="absolute top-44 right-52 h-28 w-28 rounded-full border border-secondary/30" />
            <Sparkles className="absolute top-24 left-[12%] h-5 w-5 text-secondary" />
            <Sun className="absolute bottom-16 right-[18%] h-7 w-7 text-secondary/70" />
          </div>

          <div className="mx-auto max-w-7xl grid lg:grid-cols-[1.05fr_0.95fr] gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <Badge variant="secondary" className="rounded-full border border-secondary/30 bg-secondary/10 text-primary px-4 py-1">
                Astrocartography first · Full personal intelligence platform next
              </Badge>

              <div className="space-y-6">
                <h1 className="text-5xl md:text-7xl font-serif font-semibold text-primary leading-[0.95] tracking-tight">
                  Know your pattern.<br />Plan your place.
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed">
                  Oralia maps your astrology, location lines, and life goals into practical place strategy — where to launch, love, create, heal, network, retreat, write, and begin again.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/auth">
                  <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-6 text-base rounded-full">
                    Start Your Map
                  </Button>
                </Link>
                <Link href="/places">
                  <Button size="lg" variant="outline" className="border-primary/40 text-primary hover:bg-primary/5 px-8 py-6 text-base rounded-full">
                    View Places Demo
                  </Button>
                </Link>
              </div>

              <p className="text-xs text-muted-foreground max-w-xl">
                Oralia uses symbolic systems for reflection, planning, and self-knowledge. Guidance is tendency-based, not medical, legal, financial, or fate-deterministic advice.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.9, delay: 0.15 }}
              className="relative"
            >
              <Card className="oralia-celestial-card rounded-[2rem] overflow-hidden">
                <CardContent className="p-0">
                  <div className="relative min-h-[520px] p-8 md:p-10 flex flex-col justify-between">
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_35%,hsl(var(--secondary)),transparent_22rem)]" />
                    <div className="relative flex justify-between items-start">
                      <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Best energy today</p>
                        <h2 className="text-4xl font-serif text-primary mt-2">Bali, Indonesia</h2>
                        <p className="text-muted-foreground mt-2">Creativity · reflection · soft expansion</p>
                      </div>
                      <Compass className="h-9 w-9 text-secondary" />
                    </div>

                    <div className="relative mx-auto my-10 h-72 w-72 rounded-full border border-secondary/40 flex items-center justify-center">
                      <div className="absolute h-56 w-56 rounded-full border border-secondary/25" />
                      <div className="absolute h-36 w-36 rounded-full border border-secondary/25" />
                      <div className="h-16 w-16 rounded-full bg-secondary/20 border border-secondary/50 flex items-center justify-center text-secondary">
                        <Sparkles className="h-7 w-7" />
                      </div>
                      <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-xs text-muted-foreground">Jupiter MC</span>
                      <span className="absolute bottom-4 right-5 text-xs text-muted-foreground">Venus ASC</span>
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">Moon IC</span>
                    </div>

                    <div className="relative grid sm:grid-cols-3 gap-3">
                      {[
                        ["Visibility", "88"],
                        ["Creativity", "91"],
                        ["Rest", "74"],
                      ].map(([label, score]) => (
                        <div key={label} className="rounded-2xl border border-border bg-card/70 p-4 text-center shadow-sm">
                          <p className="text-3xl font-serif text-primary">{score}</p>
                          <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>

        <section className="px-6 md:px-10 pb-24">
          <div className="mx-auto max-w-7xl grid lg:grid-cols-[0.85fr_1.15fr] gap-10 items-start">
            <div className="space-y-5">
              <p className="text-sm uppercase tracking-[0.35em] text-secondary">What your map includes</p>
              <h2 className="text-4xl md:text-5xl font-serif text-primary leading-tight">A beautiful map, but actually useful.</h2>
              <div className="space-y-3 text-muted-foreground">
                {BLUEPRINT.map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <ShieldCheck className="h-4 w-4 text-secondary shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              {FEATURES.map((feature, i) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.45 }}
                >
                  <Card className="h-full bg-card/85 border-border hover:shadow-lg transition-shadow rounded-3xl">
                    <CardContent className="p-7 space-y-5">
                      <div className="h-11 w-11 rounded-full bg-secondary/15 text-secondary border border-secondary/25 flex items-center justify-center">
                        <feature.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-serif text-2xl font-semibold text-primary mb-2">{feature.title}</h3>
                        <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
