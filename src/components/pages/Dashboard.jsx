import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import DashboardMetrics from "@/components/organisms/DashboardMetrics";
import { leadService } from "@/services/api/leadService";

const Dashboard = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await leadService.getAll();
      setLeads(data);
    } catch (err) {
      setError("Failed to load leads");
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">
          Get an overview of your sales pipeline and lead performance.
        </p>
      </div>

      <DashboardMetrics
        leads={leads}
        loading={loading}
        error={error}
        onRetry={loadLeads}
      />
    </div>
  );
};

export default Dashboard;