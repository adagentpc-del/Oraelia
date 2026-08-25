import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  User,
  PenLine,
  Activity,
  Heart,
  MapPin,
  Sun,
  BookOpen,
  Settings,
  LogOut,
  Sparkles,
  CalendarClock,
  Globe2,
  Hash,
  Fingerprint,
  Scale,
  History,
  HeartHandshake
} from "lucide-react";
import { useLogout, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";

const SIDEBAR_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/places", label: "Places Map", icon: Globe2 },
  { href: "/blueprint", label: "My Blueprint", icon: Sparkles },
  { href: "/timing", label: "Timing", icon: CalendarClock },
  { href: "/decisions", label: "Decisions", icon: Scale },
  { href: "/compatibility", label: "Compatibility", icon: HeartHandshake },
  { href: "/human-design", label: "Human Design", icon: Fingerprint },
  { href: "/numerology", label: "Numerology", icon: Hash },
  { href: "/life-events", label: "Life Events", icon: History },
  { href: "/profile", label: "My Profile", icon: User },
  { href: "/checkin", label: "Check-In", icon: PenLine },
  { href: "/patterns", label: "Patterns", icon: Activity },
  { href: "/relationships", label: "Relationships", icon: Heart },
  { href: "/locations", label: "Saved Locations", icon: MapPin },
  { href: "/chakras", label: "Chakras", icon: Sun },
  { href: "/library", label: "Library", icon: BookOpen },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function MainLayout({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const logout = useLogout();
  const queryClient = useQueryClient();

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        setLocation("/");
      }
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-card border-r border-border md:min-h-screen flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-serif font-bold text-primary tracking-wide">Oralia</h1>
          <p className="text-xs text-muted-foreground mt-1">Energetic place strategy</p>
        </div>
        <nav className="flex-1 px-4 pb-4 space-y-1 flex flex-col gap-1 overflow-y-auto">
          {SIDEBAR_ITEMS.map((item) => {
            const isActive = location === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                data-testid={`link-${item.label.toLowerCase().replaceAll(" ", "-")}`}
                className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                  isActive 
                    ? "bg-primary text-primary-foreground" 
                    : "text-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span className="font-medium text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-border">
          <button 
            onClick={handleLogout}
            data-testid="button-logout"
            className="flex items-center gap-3 px-3 py-2 w-full rounded-md text-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="font-medium text-sm">Sign out</span>
          </button>
        </div>
      </aside>
      <main className="flex-1 flex flex-col min-h-[100dvh] overflow-y-auto bg-background/50">
        <div className="container mx-auto p-4 md:p-8 max-w-6xl">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
