import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { leadService } from "@/services/api/leadService";
import ApperIcon from "@/components/ApperIcon";
import Modal from "@/components/molecules/Modal";
import CustomFieldManager from "@/components/organisms/CustomFieldManager";
import LeadsTable from "@/components/organisms/LeadsTable";
import CsvImportModal from "@/components/organisms/CsvImportModal";
import LeadDetail from "@/components/organisms/LeadDetail";
import CreateLeadForm from "@/components/organisms/CreateLeadForm";
import Button from "@/components/atoms/Button";

const Leads = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showLeadDetail, setShowLeadDetail] = useState(false);
  const [showCustomFieldManager, setShowCustomFieldManager] = useState(false);
  const [showCsvImport, setShowCsvImport] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
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
      setError('Failed to load leads data');
      toast.error('Failed to load leads data');
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
    toast.success('Lead created successfully');
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
    toast.success('Lead updated successfully');
  };

  const handleDeleteLead = async (leadId) => {
    const confirmMessage = `Are you sure you want to delete this lead? This action cannot be undone.`;
    if (!window.confirm(confirmMessage)) return;

    try {
      await leadService.delete(leadId);
      loadLeads();
      toast.success('Lead deleted successfully');
    } catch (error) {
      console.error('Failed to delete lead:', error);
      toast.error('Failed to delete lead');
    }
  };

  const handleBulkStatusChange = async (leadIds, status) => {
    try {
      await leadService.bulkUpdateStatus(leadIds, status);
      loadLeads();
      toast.success(`Updated ${leadIds.length} lead(s) status to ${status}`);
    } catch (error) {
      console.error('Failed to update lead status:', error);
      toast.error('Failed to update lead status');
    }
  };

  const handleBulkAssignUser = async (leadIds, assignedUser) => {
    try {
      await leadService.bulkAssignUser(leadIds, assignedUser);
      loadLeads();
      toast.success(`Assigned ${leadIds.length} lead(s) to ${assignedUser}`);
    } catch (error) {
      console.error('Failed to assign leads:', error);
      toast.error('Failed to assign leads');
    }
  };

  const handleBulkUpdateSource = async (leadIds, source) => {
    try {
      await leadService.bulkUpdateSource(leadIds, source);
      loadLeads();
      toast.success(`Updated ${leadIds.length} lead(s) source to ${source}`);
    } catch (error) {
      console.error('Failed to update lead source:', error);
      toast.error('Failed to update lead source');
    }
  };

  const handleBulkDelete = async (leadIds) => {
    const confirmMessage = `Are you sure you want to delete ${leadIds.length} lead(s)? This action cannot be undone.`;
    if (!window.confirm(confirmMessage)) return;

    try {
      await leadService.bulkDelete(leadIds);
      loadLeads();
      toast.success(`Deleted ${leadIds.length} lead(s) successfully`);
    } catch (error) {
      console.error('Failed to delete leads:', error);
      toast.error('Failed to delete leads');
    }
  };

  const handleCsvImportSuccess = () => {
    setShowCsvImport(false);
    loadLeads();
    toast.success('CSV import completed successfully');
  };
const handleCsvImportSuccess = () => {
    setShowCsvImport(false);
    loadLeads();
    toast.success('CSV import completed successfully');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leads</h1>
          <p className="text-gray-600 mt-1">
            Manage and track all your leads in one place
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={() => setShowCustomFieldManager(true)}
          >
            <ApperIcon name="Settings" size={16} />
            Custom Fields
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowCsvImport(true)}
          >
            <ApperIcon name="Upload" size={16} />
            Import CSV
          </Button>
          <Button onClick={handleCreateLead}>
            <ApperIcon name="Plus" size={16} />
            Create Lead
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
          <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load leads</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={loadLeads} variant="outline">
            <ApperIcon name="RefreshCw" size={16} />
            Try Again
          </Button>
        </div>
      )}

      {/* Leads Table */}
      {!loading && !error && (
        <LeadsTable
          leads={leads}
          onLeadClick={handleLeadClick}
          onLeadUpdate={handleLeadUpdate}
          onDeleteLead={handleDeleteLead}
          onBulkStatusChange={handleBulkStatusChange}
          onBulkAssignUser={handleBulkAssignUser}
          onBulkUpdateSource={handleBulkUpdateSource}
          onBulkDelete={handleBulkDelete}
        />
      )}

      {/* Create Lead Modal */}
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

      {/* Lead Detail Modal */}
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

      {/* Custom Field Manager Modal */}
      <Modal
        isOpen={showCustomFieldManager}
        onClose={() => setShowCustomFieldManager(false)}
        title="Custom Field Manager"
        size="lg"
      >
        <CustomFieldManager
          onClose={() => setShowCustomFieldManager(false)}
        />
      </Modal>

      {/* CSV Import Modal */}
      <CsvImportModal
        isOpen={showCsvImport}
        onClose={() => setShowCsvImport(false)}
        onSuccess={handleCsvImportSuccess}
      />
    </div>
  );
};

export default Leads;