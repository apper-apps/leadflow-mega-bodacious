import React, { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'
import { leadService } from '@/services/api/leadService'
import ApperIcon from '@/components/ApperIcon'
import Modal from '@/components/molecules/Modal'
import CustomFieldManager from '@/components/organisms/CustomFieldManager'
import LeadsTable from '@/components/organisms/LeadsTable'
import LeadDetail from '@/components/organisms/LeadDetail'
import CreateLeadForm from '@/components/organisms/CreateLeadForm'
import CsvImportModal from '@/components/organisms/CsvImportModal'
import Button from '@/components/atoms/Button'
const Leads = () => {
const navigate = useNavigate();
const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCustomFieldManager, setShowCustomFieldManager] = useState(false);
  const [showCsvImportModal, setShowCsvImportModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [showLeadDetail, setShowLeadDetail] = useState(false);
  const [bulkOperationLoading, setBulkOperationLoading] = useState(false);

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

  const handleBulkStatusChange = async (leadIds, status) => {
    if (!status || leadIds.length === 0) return;
    
    setBulkOperationLoading(true);
    try {
      await leadService.bulkUpdateStatus(leadIds, status);
      toast.success(`Updated status for ${leadIds.length} leads`);
      loadLeads();
} catch (err) {
      toast.error("Failed to update lead status");
    } finally {
      setBulkOperationLoading(false);
    }
  };

  const handleBulkAssignUser = async (leadIds, assignedUser) => {
    if (!assignedUser || leadIds.length === 0) return;
    
    setBulkOperationLoading(true);
    try {
      await leadService.bulkAssignUser(leadIds, assignedUser);
      toast.success(`Assigned ${leadIds.length} leads to ${assignedUser}`);
      loadLeads();
    } catch (err) {
      toast.error("Failed to assign leads");
    } finally {
      setBulkOperationLoading(false);
    }
  };

  const handleBulkUpdateSource = async (leadIds, source) => {
    if (!source || leadIds.length === 0) return;
    
    setBulkOperationLoading(true);
    try {
      await leadService.bulkUpdateSource(leadIds, source);
      toast.success(`Updated source for ${leadIds.length} leads`);
      loadLeads();
    } catch (err) {
      toast.error("Failed to update lead sources");
    } finally {
      setBulkOperationLoading(false);
    }
};

  const handleBulkDelete = async (leadIds) => {
    if (leadIds.length === 0) return;
    
    const confirmMessage = `Are you sure you want to delete ${leadIds.length} lead${leadIds.length > 1 ? 's' : ''}? This action cannot be undone.`;
    
    if (window.confirm(confirmMessage)) {
      setBulkOperationLoading(true);
      try {
        await leadService.bulkDelete(leadIds);
        toast.success(`Deleted ${leadIds.length} leads successfully`);
        loadLeads();
      } catch (err) {
        toast.error("Failed to delete leads");
      } finally {
        setBulkOperationLoading(false);
      }
    }
  };

  const handleCsvImportSuccess = () => {
    loadLeads();
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
          <Button
            variant="outline"
            onClick={() => setShowCsvImportModal(true)}
            className="flex items-center space-x-2"
          >
            <ApperIcon name="Upload" size={16} />
            <span>Import CSV</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/workflows')}
            className="flex items-center space-x-2"
          >
            <ApperIcon name="Zap" size={16} />
            <span>Workflows</span>
          </Button>
        </div>
      </div>

<LeadsTable
        leads={leads}
        loading={loading || bulkOperationLoading}
        error={error}
        onRetry={loadLeads}
        onCreateLead={handleCreateLead}
        onDeleteLead={handleDeleteLead}
        onLeadClick={handleLeadClick}
        onBulkStatusChange={handleBulkStatusChange}
        onBulkAssignUser={handleBulkAssignUser}
        onBulkUpdateSource={handleBulkUpdateSource}
        onBulkDelete={handleBulkDelete}
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

      <CsvImportModal
        isOpen={showCsvImportModal}
        onClose={() => setShowCsvImportModal(false)}
        onImportSuccess={handleCsvImportSuccess}
      />
    </div>
  );
};

export default Leads;