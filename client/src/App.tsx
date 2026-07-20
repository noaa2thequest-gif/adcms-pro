import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import Navigation from "./components/Navigation";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import FleetOverview from "./pages/FleetOverview";
import DefectControl from "./pages/DefectControl";
import NewDefect from "./pages/NewDefect";
import CabinDefects from "./pages/CabinDefects";
import MelManagement from "./pages/MelManagement";
import MccCenter from "./pages/MccCenter";
import Stores from "./pages/Stores";
import AircraftDetail from "./pages/AircraftDetail";
import Reports from "./pages/Reports";
import UserManagement from "./pages/UserManagement";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/fleet"} component={FleetOverview} />
      <Route path={"/defect-control"} component={DefectControl} />
      <Route path={"/new-defect"} component={NewDefect} />
      <Route path={"/cabin-defects"} component={CabinDefects} />
      <Route path={"/mel-management"} component={MelManagement} />
      <Route path={"/mcc-center"} component={MccCenter} />
      <Route path={"/stores"} component={Stores} />
      <Route path={"/reports"} component={Reports} />
      <Route path={"/user-management"} component={UserManagement} />
      <Route path={"/aircraft/:id"} component={AircraftDetail} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Navigation />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
