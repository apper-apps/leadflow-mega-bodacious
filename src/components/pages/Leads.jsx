import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import ApperIcon from "@/components/ApperIcon";
import Button from "@/components/atoms/Button";
import LeadsTable from "@/components/organisms/LeadsTable";
import CreateLeadForm from "@/components/organisms/CreateLeadForm";
import LeadDetail from "@/components/organisms/LeadDetail";
import CustomFieldManager from "@/components/organisms/CustomFieldManager";
import Modal from "@/components/molecules/Modal";
import { leadService } from "@/services/api/leadService";

const Leads = () => {
const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCustomFieldManager, setShowCustomFieldManager] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [showLeadDetail, setShowLeadDetail] = useState(false);

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
      toast.error("Failed to load leads");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLead = () => {
    setShowCreateModal(true);
  };

  const handleCreateSuccess = () => {
setShowCreateModal(false);
    loadLeads();
  };

  const handleLeadClick = (lead) => {
    setSelectedLead(lead);
    setShowLeadDetail(true);
  };

  const handleLeadDetailClose = () => {
    setShowLeadDetail(false);
    setSelectedLead(null);
  };

  const handleLeadUpdate = () => {
    loadLeads();
    toast.success("Lead updated successfully");
  };

  const handleDeleteLead = async (leadId) => {
    if (window.confirm("Are you sure you want to delete this lead?")) {
      try {
        await leadService.delete(leadId);
        toast.success("Lead deleted successfully");
        loadLeads();
      } catch (err) {
        toast.error("Failed to delete lead");
      }
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Leads</h1>
        <p className="text-gray-600">
          Manage your leads and track their progress through your sales pipeline.
        </p>
      </div>

<div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => setShowCustomFieldManager(true)}
            className="flex items-center space-x-2"
          >
            <ApperIcon name="Settings" size={16} />
            <span>Manage Custom Fields</span>
          </Button>
        </div>
      </div>

      <LeadsTable
        leads={leads}
        loading={loading}
        error={error}
        onRetry={loadLeads}
        onCreateLead={handleCreateLead}
        onDeleteLead={handleDeleteLead}
        onLeadClick={handleLeadClick}
      />

<Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Lead"
        size="lg"
      >
        <CreateLeadForm
          onSuccess={handleCreateSuccess}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>

<Modal
        isOpen={showCustomFieldManager}
        onClose={() => setShowCustomFieldManager(false)}
        title="Custom Field Management"
        size="xl"
      >
        <CustomFieldManager />
      </Modal>

      <Modal
        isOpen={showLeadDetail}
        onClose={handleLeadDetailClose}
        title="Lead Details"
        size="xl"
      >
        {selectedLead && (
          <LeadDetail
            lead={selectedLead}
            onUpdate={handleLeadUpdate}
            onClose={handleLeadDetailClose}
          />
        )}
      </Modal>
    </div>
  );
};

export default Leads;