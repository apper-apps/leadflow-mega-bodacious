import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import DashboardMetrics from "@/components/organisms/DashboardMetrics";
import PendingTasksWidget from "@/components/organisms/PendingTasksWidget";
import TaskModal from "@/components/organisms/TaskModal";
import AnalyticsSection from "@/components/organisms/AnalyticsSection";
import { leadService } from "@/services/api/leadService";

const Dashboard = () => {
  const navigate = useNavigate();
const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

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

const handleTaskClick = (task, action) => {
    if (action === 'view-all') {
      navigate('/tasks');
    } else {
      navigate('/tasks');
    }
  };

  const handleCreateTask = () => {
    setShowTaskModal(true);
  };

  const handleTaskCreated = () => {
    toast.success('Task created successfully');
  };

return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">
          Get an overview of your sales pipeline and lead performance.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <DashboardMetrics
            leads={leads}
            loading={loading}
            error={error}
            onRetry={loadLeads}
          />
        </div>
        
        <div className="lg:col-span-1">
          <PendingTasksWidget
            onTaskClick={handleTaskClick}
            onCreateTask={handleCreateTask}
          />
        </div>
      </div>

      {/* Advanced Analytics Section */}
      <AnalyticsSection
        leads={leads}
        loading={loading}
        error={error}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        onRetry={loadLeads}
      />

      {/* Task Modal */}
      <TaskModal
        isOpen={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        onTaskCreated={handleTaskCreated}
      />
    </div>
  );
};

export default Dashboard;