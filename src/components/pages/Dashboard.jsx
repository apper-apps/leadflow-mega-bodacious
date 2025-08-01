import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { leadService } from "@/services/api/leadService";
import ApperIcon from "@/components/ApperIcon";
import TaskModal from "@/components/organisms/TaskModal";
import PendingTasksWidget from "@/components/organisms/PendingTasksWidget";
import AnalyticsSection from "@/components/organisms/AnalyticsSection";
import DashboardMetrics from "@/components/organisms/DashboardMetrics";
import Button from "@/components/atoms/Button";

const Dashboard = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await leadService.getAll();
      setLeads(data);
    } catch (error) {
      console.error('Failed to load leads:', error);
      setError('Failed to load dashboard data');
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleTaskClick = (task, action) => {
    if (action === 'view' || action === 'edit') {
      setSelectedTask(task);
      setShowTaskModal(true);
    } else if (action === 'complete') {
      // Handle task completion
      toast.success('Task marked as complete');
      loadLeads(); // Refresh data
    }
  };

  const handleCreateTask = () => {
    setSelectedTask(null);
    setShowCreateTaskModal(true);
  };

  const handleTaskCreated = () => {
    setShowTaskModal(false);
    setShowCreateTaskModal(false);
    setSelectedTask(null);
    loadLeads(); // Refresh data
    toast.success('Task created successfully');
  };

const handleTaskModalClose = () => {
    setShowTaskModal(false);
    setShowCreateTaskModal(false);
    setSelectedTask(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back! Here's what's happening with your leads today.
          </p>
        </div>
        <Button onClick={handleCreateTask}>
          <ApperIcon name="Plus" size={16} />
          Quick Task
        </Button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="animate-pulse">
              <div className="h-80 bg-gray-200 rounded-lg"></div>
            </div>
            <div className="animate-pulse">
              <div className="h-64 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="animate-pulse">
              <div className="h-96 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-12">
          <div className="text-red-500 mb-4">
            <ApperIcon name="AlertCircle" size={48} />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load dashboard</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={loadLeads} variant="outline">
            <ApperIcon name="RefreshCw" size={16} />
            Try Again
          </Button>
        </div>
      )}

      {/* Main Content */}
      {!loading && !error && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Dashboard Metrics */}
            <DashboardMetrics leads={leads} />

            {/* Analytics Section */}
            <AnalyticsSection leads={leads} />
          </div>

          {/* Right Column - Sidebar Content */}
          <div className="space-y-6">
            {/* Pending Tasks Widget */}
            <PendingTasksWidget
              onTaskClick={handleTaskClick}
              onCreateTask={handleCreateTask}
            />
          </div>
        </div>
      )}

      {/* Task Modal */}
      {selectedTask && (
        <TaskModal
          isOpen={showTaskModal}
          onClose={handleTaskModalClose}
          task={selectedTask}
          onTaskCreated={handleTaskCreated}
          onTaskUpdated={handleTaskCreated}
        />
      )}

      {/* Create Task Modal */}
      {showCreateTaskModal && (
        <TaskModal
          isOpen={showCreateTaskModal}
          onClose={handleTaskModalClose}
          onTaskCreated={handleTaskCreated}
          onTaskUpdated={handleTaskCreated}
        />
      )}
    </div>
  );
};

export default Dashboard;