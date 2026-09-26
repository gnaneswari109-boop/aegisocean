import { createRouter, createRootRoute, createRoute } from '@tanstack/react-router';
import { AppShell } from './components/AppShell';
import { OverviewPage } from './pages/OverviewPage';
import { AnalyzePage } from './pages/AnalyzePage';
import { AnomalyMapPage } from './pages/AnomalyMapPage';

const rootRoute = createRootRoute({
  component: AppShell,
});

const overviewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: OverviewPage,
});

const analyzeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/analyze',
  component: AnalyzePage,
});

const anomalyMapRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/anomaly-map',
  component: AnomalyMapPage,
});

const routeTree = rootRoute.addChildren([overviewRoute, analyzeRoute, anomalyMapRoute]);

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
