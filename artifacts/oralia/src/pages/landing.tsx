import { Link } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const FEATURES = [
  { title: "Personal Energy Profile", description: "Understand your unique energetic blueprint." },
  { title: "Daily Energy Dashboard", description: "Your daily guide to alignment and flow." },
  { title: "Personal Pattern Intelligence", description: "Track your moods, energy, and stress over time." },
  { title: "Relationship Energy Overlay", description: "Map dynamics and improve communication." },
  { title: "Location Strategy", description: "Find the best places for your goals." },
  { title: "Chakra Intelligence", description: "Assess and balance your energetic centers." },
  { title: "Human Design & Astrology", description: "Deep dive into ancient systems of knowledge." },
  { title: "Moon & Cycle Planning", description: "Align your life with natural rhythms." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="py-6 px-8 flex justify-between items-center border-b border-border">
        <h1 className="text-2xl font-serif font-bold text-primary tracking-wide">Oralia</h1>
        <div className="flex gap-4">
          <Link href="/auth">
            <Button variant="outline" className="border-primary text-primary hover:bg-primary/5">Sign In</Button>
          </Link>
          <Link href="/auth">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">Start My Profile</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-3xl"
        >
          <h2 className="text-5xl md:text-7xl font-serif font-bold text-primary mb-6">Know your pattern.<br />Plan your life.</h2>
          <p className="text-xl text-muted-foreground mb-10 font-sans max-w-2xl mx-auto leading-relaxed">
            A luxury personal operating system for understanding your energy patterns, timing, relationships, and body rhythms. Reclaim your alignment.
          </p>
          <div className="flex justify-center gap-6">
            <Link href="/auth">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-6 text-lg rounded-none">
                Start My Profile
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary/5 px-8 py-6 text-lg rounded-none">
                View Demo
              </Button>
            </Link>
          </div>
        </motion.div>

        <div className="mt-32 w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pb-32">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="bg-card border border-border p-8 rounded-sm hover:shadow-lg transition-shadow"
            >
              <h3 className="font-serif text-xl font-bold text-primary mb-3">{feature.title}</h3>
              <p className="text-muted-foreground text-sm">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}
