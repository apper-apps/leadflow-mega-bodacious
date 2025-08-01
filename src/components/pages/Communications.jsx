import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import ApperIcon from '@/components/ApperIcon';
import Button from '@/components/atoms/Button';
import Card from '@/components/atoms/Card';
import Input from '@/components/atoms/Input';
import Select from '@/components/atoms/Select';
import Modal from '@/components/molecules/Modal';
import SearchBar from '@/components/molecules/SearchBar';
import StatusBadge from '@/components/molecules/StatusBadge';
import Loading from '@/components/ui/Loading';
import Error from '@/components/ui/Error';
import Empty from '@/components/ui/Empty';
import { communicationService } from '@/services/api/communicationService';
import { leadService } from '@/services/api/leadService';

const communicationTypes = [
  { value: 'call', label: 'Call', icon: 'Phone' },
  { value: 'email', label: 'Email', icon: 'Mail' },
  { value: 'meeting', label: 'Meeting', icon: 'Calendar' }
];

const outcomeOptions = [
  { value: 'positive', label: 'Positive' },
  { value: 'neutral', label: 'Neutral' },
  { value: 'negative', label: 'Negative' },
  { value: 'no_answer', label: 'No Answer' },
  { value: 'sent', label: 'Sent' },
  { value: 'replied', label: 'Replied' }
];

function Communications() {
  const [communications, setCommunications] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState('');
  const [leadFilter, setLeadFilter] = useState('');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');
  
  // Sorting
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCommunication, setSelectedCommunication] = useState(null);
  
  // Form data
  const [formData, setFormData] = useState({
    leadId: '',
    type: 'call',
    subject: '',
    date: '',
    duration: '',
    outcome: 'positive',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [communicationsData, leadsData] = await Promise.all([
        communicationService.getAll(),
        leadService.getAll()
      ]);
      setCommunications(communicationsData);
      setLeads(leadsData);
    } catch (err) {
      setError('Failed to load communications data');
      toast.error('Failed to load communications data');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      const searchParams = {
        search: searchTerm,
        type: typeFilter,
        outcome: outcomeFilter,
        leadId: leadFilter,
        dateFrom: dateFromFilter,
        dateTo: dateToFilter
      };
      
      const results = await communicationService.searchCommunications(searchParams);
      setCommunications(results);
    } catch (err) {
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setTypeFilter('');
    setOutcomeFilter('');
    setLeadFilter('');
    setDateFromFilter('');
    setDateToFilter('');
    loadData();
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleAdd = async () => {
    try {
      const newCommunication = await communicationService.create({
        ...formData,
        leadId: parseInt(formData.leadId),
        duration: formData.duration ? parseInt(formData.duration) : null,
        date: formData.date || new Date().toISOString()
      });
      
      setCommunications([newCommunication, ...communications]);
      setIsAddModalOpen(false);
      resetForm();
      toast.success('Communication added successfully');
    } catch (err) {
      toast.error('Failed to add communication');
    }
  };

  const handleEdit = async () => {
    try {
      const updatedCommunication = await communicationService.update(selectedCommunication.Id, {
        ...formData,
        leadId: parseInt(formData.leadId),
        duration: formData.duration ? parseInt(formData.duration) : null
      });
      
      setCommunications(communications.map(comm => 
        comm.Id === selectedCommunication.Id ? updatedCommunication : comm
      ));
      setIsEditModalOpen(false);
      setSelectedCommunication(null);
      resetForm();
      toast.success('Communication updated successfully');
    } catch (err) {
      toast.error('Failed to update communication');
    }
  };

  const handleDelete = async () => {
    try {
      await communicationService.delete(selectedCommunication.Id);
      setCommunications(communications.filter(comm => comm.Id !== selectedCommunication.Id));
      setIsDeleteModalOpen(false);
      setSelectedCommunication(null);
      toast.success('Communication deleted successfully');
    } catch (err) {
      toast.error('Failed to delete communication');
    }
  };

  const resetForm = () => {
    setFormData({
      leadId: '',
      type: 'call',
      subject: '',
      date: '',
      duration: '',
      outcome: 'positive',
      notes: ''
    });
  };

  const openEditModal = (communication) => {
    setSelectedCommunication(communication);
    setFormData({
      leadId: communication.leadId?.toString() || '',
      type: communication.type,
      subject: communication.subject || '',
      date: communication.date ? format(new Date(communication.date), "yyyy-MM-dd'T'HH:mm") : '',
      duration: communication.duration?.toString() || '',
      outcome: communication.outcome || 'positive',
      notes: communication.notes || ''
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (communication) => {
    setSelectedCommunication(communication);
    setIsDeleteModalOpen(true);
  };

  const getLeadName = (leadId) => {
    const lead = leads.find(l => l.Id === leadId);
    return lead ? `${lead.firstName} ${lead.lastName}` : 'Unknown Lead';
  };

  const getOutcomeColor = (outcome) => {
    switch (outcome) {
      case 'positive': return 'success';
      case 'neutral': return 'info';
      case 'negative': return 'error';
      case 'no_answer': return 'warning';
      case 'sent': return 'info';
      case 'replied': return 'success';
      default: return 'info';
    }
  };

  const getTypeIcon = (type) => {
    const typeObj = communicationTypes.find(t => t.value === type);
    return typeObj ? typeObj.icon : 'MessageSquare';
  };

  const sortedCommunications = [...communications].sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];
    
    if (sortField === 'date') {
      aValue = new Date(aValue);
      bValue = new Date(bValue);
    }
    
    if (sortField === 'leadName') {
      aValue = getLeadName(a.leadId);
      bValue = getLeadName(b.leadId);
    }
    
    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const getSortIcon = (field) => {
    if (sortField !== field) return 'ArrowUpDown';
    return sortDirection === 'asc' ? 'ArrowUp' : 'ArrowDown';
  };

  if (loading) return <Loading />;
  if (error) return <Error message={error} onRetry={loadData} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Communications Center</h1>
          <p className="text-gray-600 mt-1">Track and manage all customer communications</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="w-full sm:w-auto">
          <ApperIcon name="Plus" size={16} />
          Add Communication
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-4">
          <div className="xl:col-span-2">
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search communications..."
              onSearch={handleSearch}
            />
          </div>
          
          <Select
            value={typeFilter}
            onChange={setTypeFilter}
            placeholder="All Types"
          >
            <option value="">All Types</option>
            {communicationTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </Select>

          <Select
            value={outcomeFilter}
            onChange={setOutcomeFilter}
            placeholder="All Outcomes"
          >
            <option value="">All Outcomes</option>
            {outcomeOptions.map(outcome => (
              <option key={outcome.value} value={outcome.value}>{outcome.label}</option>
            ))}
          </Select>

          <Select
            value={leadFilter}
            onChange={setLeadFilter}
            placeholder="All Leads"
          >
            <option value="">All Leads</option>
            {leads.map(lead => (
              <option key={lead.Id} value={lead.Id}>
                {lead.firstName} {lead.lastName}
              </option>
            ))}
          </Select>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSearch} className="flex-1">
              <ApperIcon name="Search" size={16} />
              Search
            </Button>
            <Button variant="outline" onClick={clearFilters}>
              <ApperIcon name="X" size={16} />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            type="datetime-local"
            value={dateFromFilter}
            onChange={(e) => setDateFromFilter(e.target.value)}
            placeholder="From Date"
          />
          <Input
            type="datetime-local"
            value={dateToFilter}
            onChange={(e) => setDateToFilter(e.target.value)}
            placeholder="To Date"
          />
        </div>
      </Card>

      {/* Communications Table */}
      <Card>
        {sortedCommunications.length === 0 ? (
          <Empty 
            title="No communications found"
            description="Start tracking customer interactions by adding your first communication."
            action={
              <Button onClick={() => setIsAddModalOpen(true)}>
                <ApperIcon name="Plus" size={16} />
                Add Communication
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('type')}
                      className="flex items-center gap-1 hover:text-gray-700"
                    >
                      Type
                      <ApperIcon name={getSortIcon('type')} size={12} />
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('subject')}
                      className="flex items-center gap-1 hover:text-gray-700"
                    >
                      Subject
                      <ApperIcon name={getSortIcon('subject')} size={12} />
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('leadName')}
                      className="flex items-center gap-1 hover:text-gray-700"
                    >
                      Lead
                      <ApperIcon name={getSortIcon('leadName')} size={12} />
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('date')}
                      className="flex items-center gap-1 hover:text-gray-700"
                    >
                      Date
                      <ApperIcon name={getSortIcon('date')} size={12} />
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Outcome
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedCommunications.map((communication, index) => (
                  <motion.tr
                    key={communication.Id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <ApperIcon name={getTypeIcon(communication.type)} size={16} className="text-gray-500" />
                        <span className="text-sm font-medium text-gray-900 capitalize">
                          {communication.type}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 font-medium">
                        {communication.subject || 'No subject'}
                      </div>
                      {communication.notes && (
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {communication.notes}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {getLeadName(communication.leadId)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {format(new Date(communication.date), 'MMM dd, yyyy HH:mm')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge 
                        status={communication.outcome}
                        variant={getOutcomeColor(communication.outcome)}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {communication.duration ? `${communication.duration}m` : '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(communication)}
                        >
                          <ApperIcon name="Edit" size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteModal(communication)}
                        >
                          <ApperIcon name="Trash2" size={14} />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add Communication Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          resetForm();
        }}
        title="Add Communication"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Lead"
              value={formData.leadId}
              onChange={(e) => setFormData({ ...formData, leadId: e.target.value })}
              required
            >
              <option value="">Select Lead</option>
              {leads.map(lead => (
                <option key={lead.Id} value={lead.Id}>
                  {lead.firstName} {lead.lastName}
                </option>
              ))}
            </Select>

            <Select
              label="Type"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            >
              {communicationTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </Select>
          </div>

          <Input
            label="Subject"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            placeholder="Communication subject"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Date & Time"
              type="datetime-local"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />

            {formData.type === 'call' || formData.type === 'meeting' ? (
              <Input
                label="Duration (minutes)"
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                placeholder="Duration in minutes"
              />
            ) : (
              <div></div>
            )}
          </div>

          <Select
            label="Outcome"
            value={formData.outcome}
            onChange={(e) => setFormData({ ...formData, outcome: e.target.value })}
          >
            {outcomeOptions.map(outcome => (
              <option key={outcome.value} value={outcome.value}>{outcome.label}</option>
            ))}
          </Select>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Communication notes..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddModalOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={!formData.leadId}>
              <ApperIcon name="Plus" size={16} />
              Add Communication
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Communication Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedCommunication(null);
          resetForm();
        }}
        title="Edit Communication"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Lead"
              value={formData.leadId}
              onChange={(e) => setFormData({ ...formData, leadId: e.target.value })}
              required
            >
              <option value="">Select Lead</option>
              {leads.map(lead => (
                <option key={lead.Id} value={lead.Id}>
                  {lead.firstName} {lead.lastName}
                </option>
              ))}
            </Select>

            <Select
              label="Type"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            >
              {communicationTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </Select>
          </div>

          <Input
            label="Subject"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            placeholder="Communication subject"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Date & Time"
              type="datetime-local"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />

            {formData.type === 'call' || formData.type === 'meeting' ? (
              <Input
                label="Duration (minutes)"
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                placeholder="Duration in minutes"
              />
            ) : (
              <div></div>
            )}
          </div>

          <Select
            label="Outcome"
            value={formData.outcome}
            onChange={(e) => setFormData({ ...formData, outcome: e.target.value })}
          >
            {outcomeOptions.map(outcome => (
              <option key={outcome.value} value={outcome.value}>{outcome.label}</option>
            ))}
          </Select>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Communication notes..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditModalOpen(false);
                setSelectedCommunication(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={!formData.leadId}>
              <ApperIcon name="Save" size={16} />
              Update Communication
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedCommunication(null);
        }}
        title="Delete Communication"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete this communication? This action cannot be undone.
          </p>
          
          {selectedCommunication && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm">
                <div className="font-medium">{selectedCommunication.subject || 'No subject'}</div>
                <div className="text-gray-500">
                  {selectedCommunication.type} - {getLeadName(selectedCommunication.leadId)}
                </div>
                <div className="text-gray-500">
                  {format(new Date(selectedCommunication.date), 'MMM dd, yyyy HH:mm')}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setSelectedCommunication(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <ApperIcon name="Trash2" size={16} />
              Delete Communication
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default Communications;