import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/api/queryClient";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "@/layouts/AppLayout";
import LoginPage from "@/pages/LoginPage";
import SchedulePage from "@/pages/SchedulePage";
import TeamPage from "@/pages/TeamPage";
import ShiftTypesPage from "@/pages/ShiftTypesPage";
import ConfigPage from "@/pages/ConfigPage";
import ToastContainer from "@/components/Toast";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ToastContainer />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/schedule" element={<SchedulePage />} />
              <Route path="/team" element={<TeamPage />} />
              <Route path="/shift-types" element={<ShiftTypesPage />} />
              <Route path="/config" element={<ConfigPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/schedule" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
