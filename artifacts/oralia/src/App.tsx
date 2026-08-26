import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import LandingPage from "@/pages/landing";
import AuthPage from "@/pages/auth";
import OnboardingPage from "@/pages/onboarding";
import DashboardPage from "@/pages/dashboard";
import ProfilePage from "@/pages/profile";
import CheckInPage from "@/pages/checkin";
import PatternsPage from "@/pages/patterns";
import RelationshipsPage from "@/pages/relationships";
import LocationsPage from "@/pages/locations";
import ChakrasPage from "@/pages/chakras";
import LibraryPage from "@/pages/library";
import SettingsPage from "@/pages/settings";
import BlueprintPage from "@/pages/blueprint";
import TimingPage from "@/pages/timing";
import PlacesPage from "@/pages/places";
import NumerologyPage from "@/pages/numerology";
import HumanDesignPage from "@/pages/human-design";
import DecisionsPage from "@/pages/decisions";
import LifeEventsPage from "@/pages/life-events";
import CompatibilityPage from "@/pages/compatibility";

import { MainLayout } from "@/components/layout/main-layout";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/onboarding" component={OnboardingPage} />
      <Route path="/dashboard">
        <MainLayout><DashboardPage /></MainLayout>
      </Route>
      <Route path="/profile">
        <MainLayout><ProfilePage /></MainLayout>
      </Route>
      <Route path="/checkin">
        <MainLayout><CheckInPage /></MainLayout>
      </Route>
      <Route path="/patterns">
        <MainLayout><PatternsPage /></MainLayout>
      </Route>
      <Route path="/relationships">
        <MainLayout><RelationshipsPage /></MainLayout>
      </Route>
      <Route path="/locations">
        <MainLayout><LocationsPage /></MainLayout>
      </Route>
      <Route path="/chakras">
        <MainLayout><ChakrasPage /></MainLayout>
      </Route>
      <Route path="/library">
        <MainLayout><LibraryPage /></MainLayout>
      </Route>
      <Route path="/settings">
        <MainLayout><SettingsPage /></MainLayout>
      </Route>
      <Route path="/blueprint">
        <MainLayout><BlueprintPage /></MainLayout>
      </Route>
      <Route path="/timing">
        <MainLayout><TimingPage /></MainLayout>
      </Route>
      <Route path="/places">
        <MainLayout><PlacesPage /></MainLayout>
      </Route>
      <Route path="/numerology">
        <MainLayout><NumerologyPage /></MainLayout>
      </Route>
      <Route path="/human-design">
        <MainLayout><HumanDesignPage /></MainLayout>
      </Route>
      <Route path="/decisions">
        <MainLayout><DecisionsPage /></MainLayout>
      </Route>
      <Route path="/life-events">
        <MainLayout><LifeEventsPage /></MainLayout>
      </Route>
      <Route path="/compatibility">
        <MainLayout><CompatibilityPage /></MainLayout>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
