import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { leadService } from "@/services/api/leadService";
import ApperIcon from "@/components/ApperIcon";
import PipelineBoard from "@/components/organisms/PipelineBoard";
import Button from "@/components/atoms/Button";

const Pipeline = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
      setError('Failed to load pipeline data');
      toast.error('Failed to load pipeline data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sales Pipeline</h1>
          <p className="text-gray-600 mt-1">
            Track and manage your leads through the sales process
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
          >
            <ApperIcon name="RefreshCw" size={16} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-12">
          <div className="text-red-500 mb-4">
            <ApperIcon name="AlertCircle" size={48} />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load pipeline</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={loadLeads} variant="outline">
            <ApperIcon name="RefreshCw" size={16} />
            Try Again
          </Button>
        </div>
      )}

      {/* Pipeline Board */}
      {!loading && !error && (
        <PipelineBoard 
          leads={leads}
          onLeadUpdate={loadLeads}
        />
      )}
    </div>
  );
};

export default Pipeline;