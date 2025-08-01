import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import React from "react";
import "@/index.css";
import Layout from "@/components/organisms/Layout";
import Pipeline from "@/components/pages/Pipeline";
import Tasks from "@/components/pages/Tasks";
import Communications from "@/components/pages/Communications";
import Dashboard from "@/components/pages/Dashboard";
import WorkflowAutomation from "@/components/pages/WorkflowAutomation";
import Leads from "@/components/pages/Leads";

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route index element={<Dashboard />} />
          <Route path="leads" element={<Leads />} />
          <Route path="pipeline" element={<Pipeline />} />
          <Route path="workflows" element={<WorkflowAutomation />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="communications" element={<Communications />} />
        </Routes>
      </Layout>
<ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        style={{ zIndex: 9999 }}
      />
    </BrowserRouter>
  );
}

export default App;