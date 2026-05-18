import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './index.css';
import App from './App.tsx';
import { ProjectsPage } from './pages/ProjectsPage.tsx';
import { ProjectPage } from './pages/ProjectPage.tsx';
import { MobileLandingPage } from './pages/MobileLandingPage.tsx';
import { useIsMobile } from './hooks/useIsMobile.ts';
import { IS_SERVER_MODE } from '@/config/runtime';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
});

function AppRouter() {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <MobileLandingPage />;
  }

  return (
    <Routes>
      {IS_SERVER_MODE ? (
        <>
          <Route path="/" element={<ProjectsPage />} />
          <Route path="/projects/:projectId" element={<ProjectPage />} />
          <Route
            path="/projects/:projectId/diagrams/:diagramId"
            element={<App />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </>
      ) : (
        <>
          <Route path="/" element={<App />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </>
      )}
    </Routes>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>
);
