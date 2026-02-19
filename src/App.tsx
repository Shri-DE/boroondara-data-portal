import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";

import ProtectedRoute from "./components/common/ProtectedRoute";
import TopNav from "./components/common/TopNav";

import Home from "./pages/Home";
import Onboard from "./pages/Onboard";
import UnifiedChat from "./pages/UnifiedChat";
import Admin from "./pages/Admin";
import Datasets from "./pages/Datasets";
import Dashboards from "./pages/Dashboards";
import Reports from "./pages/Reports";
import Geospatial from "./pages/Geospatial";
import BoroondraABS from "./pages/BoroondraABS";
import AuthRedirect from "./pages/AuthRedirect";

export default function App() {
  const location = useLocation();
  const hideNav = ["/", "/auth", "/onboard"].includes(location.pathname);

  return (
    <>
      <TopNav show={!hideNav} />

      <Routes>
        {/* Public pages */}
        <Route path="/" element={<Home />} />
        <Route path="/onboard" element={<Onboard />} />
        <Route path="/auth" element={<AuthRedirect />} />

        {/* Protected pages */}
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <UnifiedChat />
            </ProtectedRoute>
          }
        />

        {/* Redirect old agent routes to chat */}
        <Route path="/agents" element={<Navigate to="/chat" replace />} />
        <Route path="/agents/:agentId" element={<Navigate to="/chat" replace />} />

        <Route
          path="/datasets"
          element={
            <ProtectedRoute>
              <Datasets />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboards"
          element={
            <ProtectedRoute>
              <Dashboards />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          }
        />

        <Route
          path="/geospatial"
          element={
            <ProtectedRoute>
              <Geospatial />
            </ProtectedRoute>
          }
        />

        <Route
          path="/abs"
          element={
            <ProtectedRoute>
              <BoroondraABS />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <Admin />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
