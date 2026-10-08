import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import { AppLayout } from '@/components/app-layout';
import { SkeletonList } from '@/components/skeleton';

const TodayPage = lazy(() => import('@/pages/today'));
const RoutinePage = lazy(() => import('@/pages/routine'));
const EditTreinoPage = lazy(() => import('@/pages/routine/edit-treino'));
const HistoryPage = lazy(() => import('@/pages/history'));
const ExerciseHistoryPage = lazy(() => import('@/pages/history/exercise-detail'));
const DataPage = lazy(() => import('@/pages/data'));
const ActiveSessionPage = lazy(() => import('@/pages/active-session'));

function RouteFallback() {
  return (
    <div className="p-4">
      <SkeletonList />
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/today" element={<TodayPage />} />
          <Route path="/routine" element={<RoutinePage />} />
          <Route path="/routine/new" element={<EditTreinoPage />} />
          <Route path="/routine/:treinoId" element={<EditTreinoPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/history/exercise/:exerciseId" element={<ExerciseHistoryPage />} />
          <Route path="/data" element={<DataPage />} />
        </Route>
        <Route path="/session/:sessionId" element={<ActiveSessionPage />} />

        <Route path="*" element={<Navigate to="/today" replace />} />
      </Routes>
    </Suspense>
  );
}
