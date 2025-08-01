import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import ApperIcon from "@/components/ApperIcon";
import Card from "@/components/atoms/Card";
import StatusBadge from "@/components/molecules/StatusBadge";
import Loading from "@/components/ui/Loading";
import Error from "@/components/ui/Error";
import Empty from "@/components/ui/Empty";
import { pipelineService } from "@/services/api/pipelineService";
import { leadService } from "@/services/api/leadService";

const PipelineBoard = ({ leads, loading, error, onRetry, onLeadUpdate }) => {
  const [stages, setStages] = useState([]);
  const [stagesLoading, setStagesLoading] = useState(true);
  const [draggedLead, setDraggedLead] = useState(null);

  useEffect(() => {
    loadStages();
  }, []);

  const loadStages = async () => {
    try {
      setStagesLoading(true);
      const data = await pipelineService.getStages();
      setStages(data);
    } catch (err) {
      toast.error("Failed to load pipeline stages");
    } finally {
      setStagesLoading(false);
    }
  };

  const getLeadsByStatus = (status) => {
    return leads.filter(lead => lead.status === status);
  };

  const handleDragStart = (e, lead) => {
    setDraggedLead(lead);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e, newStatus) => {
    e.preventDefault();
    
    if (!draggedLead || draggedLead.status === newStatus) {
      setDraggedLead(null);
      return;
    }

    try {
      await leadService.updateStatus(draggedLead.Id, newStatus);
      onLeadUpdate();
      toast.success(`Lead moved to ${newStatus}`);
    } catch (err) {
      toast.error("Failed to update lead status");
    } finally {
      setDraggedLead(null);
    }
  };

  if (loading || stagesLoading) {
    return <Loading type="kanban" />;
  }

  if (error) {
    return <Error message={error} onRetry={onRetry} />;
  }

  if (leads.length === 0) {
    return (
      <Empty
        title="No leads in pipeline"
        description="Start building your sales pipeline by adding your first lead."
        icon="GitBranch"
        actionLabel="Add First Lead"
        onAction={() => window.location.href = "/leads"}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
      {stages.map((stage) => {
        const stageLeads = getLeadsByStatus(stage.name);
        const stageValue = stageLeads.reduce((sum, lead) => sum + lead.value, 0);

        return (
          <div
            key={stage.Id}
            className="bg-gray-50 rounded-lg p-4"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, stage.name)}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900">{stage.name}</h3>
                <p className="text-sm text-gray-600">
                  {stageLeads.length} leads • ${stageValue.toLocaleString()}
                </p>
              </div>
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: stage.color }}
              />
            </div>

            <div className="space-y-3">
              {stageLeads.length === 0 ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <ApperIcon name="Plus" size={24} className="text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Drop leads here</p>
                </div>
              ) : (
                stageLeads.map((lead, index) => (
                  <motion.div
                    key={lead.Id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, lead)}
                    className={`cursor-move ${draggedLead?.Id === lead.Id ? "opacity-50" : ""}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                  >
                    <Card className="bg-white hover:shadow-md transition-shadow duration-200">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <h4 className="font-semibold text-gray-900 text-sm">
                            {lead.name}
                          </h4>
                          <StatusBadge status={lead.status} />
                        </div>
                        
                        <div className="space-y-1">
                          <p className="text-sm text-gray-600 flex items-center">
                            <ApperIcon name="Building" size={14} className="mr-2 text-gray-400" />
                            {lead.company}
                          </p>
                          <p className="text-sm text-gray-600 flex items-center">
                            <ApperIcon name="Mail" size={14} className="mr-2 text-gray-400" />
                            {lead.email}
                          </p>
                          <p className="text-sm text-gray-600 flex items-center">
                            <ApperIcon name="Phone" size={14} className="mr-2 text-gray-400" />
                            {lead.phone}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t">
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {lead.source}
                          </span>
                          <span className="text-sm font-semibold text-gray-900">
                            ${lead.value.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PipelineBoard;