import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format, isPast, isToday } from 'date-fns';
import { toast } from 'react-toastify';
import ApperIcon from '@/components/ApperIcon';
import Button from '@/components/atoms/Button';
import Card from '@/components/atoms/Card';
import Input from '@/components/atoms/Input';
import Select from '@/components/atoms/Select';
import FormField from '@/components/molecules/FormField';
import StatusBadge from '@/components/molecules/StatusBadge';
import TaskModal from '@/components/organisms/TaskModal';
import CommunicationModal from '@/components/organisms/CommunicationModal';
import CustomFieldRenderer from '@/components/organisms/CustomFieldRenderer';
import { leadService } from '@/services/api/leadService';
import { leadSourceService } from '@/services/api/leadSourceService';
import { taskService } from '@/services/api/taskService';
import { communicationService } from '@/services/api/communicationService';
import { teamMemberService } from '@/services/api/teamMemberService';
import { customFieldService } from '@/services/api/customFieldService';

const LeadDetail = ({ lead, onUpdate, onClose }) => {
const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
const [formData, setFormData] = useState({});
  const [customFieldValues, setCustomFieldValues] = useState({});
  const [newNote, setNewNote] = useState('');
  const [editingNote, setEditingNote] = useState(null);
  const [editNoteContent, setEditNoteContent] = useState('');
  const [sources, setSources] = useState([]);
  const [customFields, setCustomFields] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [communications, setCommunications] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [assignmentHistory, setAssignmentHistory] = useState([]);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showCommModal, setShowCommModal] = useState(false);
  const [editingComm, setEditingComm] = useState(null);
  const [statusOptions] = useState([
    'New', 'Contacted', 'Qualified', 'Proposal', 'Won', 'Lost'
  ]);

useEffect(() => {
    setFormData({
      name: lead.name || '',
      email: lead.email || '',
      phone: lead.phone || '',
      company: lead.company || '',
      title: lead.title || '',
      address: lead.address || '',
      source: lead.source || '',
      status: lead.status || '',
      value: lead.value || 0,
      assignedUser: lead.assignedUser || ''
    });
    setCustomFieldValues(lead.customFields || {});
    loadSources();
    loadCustomFields();
    loadTasks();
    loadTeamMembers();
    loadAssignmentHistory();
  }, [lead]);

  const loadCustomFields = async () => {
    try {
      const customFieldsData = await customFieldService.getAll();
      setCustomFields(customFieldsData);
    } catch (error) {
      console.error('Failed to load custom fields:', error);
    }
  };

const loadSources = async () => {
    try {
      const sourcesData = await leadSourceService.getAll();
      setSources(sourcesData);
    } catch (error) {
      console.error('Failed to load sources:', error);
    }
  };

  const loadTasks = async () => {
    try {
      const tasksData = await taskService.getByLeadId(lead.Id);
      setTasks(tasksData);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  };

  const loadTeamMembers = async () => {
    try {
      const membersData = await teamMemberService.getActive();
      setTeamMembers(membersData);
    } catch (error) {
      console.error('Failed to load team members:', error);
    }
  };

  const loadAssignmentHistory = async () => {
    try {
      const history = await leadService.getAssignmentHistory(lead.Id);
      setAssignmentHistory(history);
    } catch (error) {
      console.error('Failed to load assignment history:', error);
    }
  };

const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'value' ? parseFloat(value) || 0 : value
    }));
  };

  const handleCustomFieldChange = (newValues) => {
    setCustomFieldValues(newValues);
  };

  const handleAssignmentChange = async (newAssignedUser) => {
    try {
      setLoading(true);
      await leadService.assignLead(lead.Id, newAssignedUser, "User", "Manual reassignment");
      setFormData(prev => ({
        ...prev,
        assignedUser: newAssignedUser
      }));
      toast.success(`Lead assigned to ${newAssignedUser || 'Unassigned'}`);
      loadAssignmentHistory();
      onUpdate();
    } catch (error) {
      toast.error('Failed to update assignment');
      console.error('Assignment error:', error);
    } finally {
      setLoading(false);
    }
  };

const handleSave = async () => {
    setLoading(true);
    try {
      const updateData = { 
        ...formData,
        customFields: customFieldValues
      };
      
      // Track assignment change if it was modified
      if (formData.assignedUser !== lead.assignedUser) {
        updateData.assignedBy = "User";
        updateData.assignmentReason = "Updated via lead details";
      }
      
      await leadService.update(lead.Id, updateData);
      setIsEditing(false);
      toast.success('Lead updated successfully');
      loadAssignmentHistory();
      onUpdate();
    } catch (error) {
      toast.error('Failed to update lead');
      console.error('Update error:', error);
    } finally {
      setLoading(false);
    }
  };

const handleCancel = () => {
    setFormData({
      name: lead.name || '',
      email: lead.email || '',
      phone: lead.phone || '',
      company: lead.company || '',
      title: lead.title || '',
      address: lead.address || '',
      source: lead.source || '',
      status: lead.status || '',
      value: lead.value || 0,
      assignedUser: lead.assignedUser || ''
    });
    setCustomFieldValues(lead.customFields || {});
    setIsEditing(false);
  };

const handleAddNote = async () => {
    if (!newNote.trim()) return;

    setLoading(true);
    try {
      await leadService.addNote(lead.Id, newNote.trim());
      setNewNote('');
      onUpdate();
    } catch (error) {
      toast.error('Failed to add note');
      console.error('Add note error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditNote = (note) => {
    setEditingNote(note.id);
    setEditNoteContent(note.content);
  };

  const handleSaveNote = async (noteId) => {
    if (!editNoteContent.trim()) return;

    setLoading(true);
    try {
      await leadService.updateNote(lead.Id, noteId, editNoteContent.trim());
      setEditingNote(null);
      setEditNoteContent('');
      onUpdate();
    } catch (error) {
      toast.error('Failed to update note');
      console.error('Update note error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEditNote = () => {
    setEditingNote(null);
    setEditNoteContent('');
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;

    setLoading(true);
    try {
      await leadService.deleteNote(lead.Id, noteId);
      onUpdate();
    } catch (error) {
      toast.error('Failed to delete note');
      console.error('Delete note error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = () => {
    setShowTaskModal(true);
  };

  const handleTaskCreated = () => {
    loadTasks();
    toast.success('Task created successfully');
  };

  const handleMarkTaskComplete = async (taskId) => {
try {
      await taskService.markComplete(taskId);
      loadTasks();
      toast.success('Task marked as complete');
    } catch (error) {
      toast.error('Failed to complete task');
      console.error('Complete task error:', error);
    }
  };

  const loadCommunications = async () => {
    try {
      const communicationsData = await communicationService.getByLeadId(lead.Id);
      setCommunications(communicationsData);
    } catch (error) {
      console.error('Load communications error:', error);
    }
  };

  const handleCreateCommunication = (type = 'call') => {
    setEditingComm(null);
    setShowCommModal(true);
  };

  const handleEditCommunication = (communication) => {
    setEditingComm(communication);
    setShowCommModal(true);
  };

  const handleCommunicationSaved = () => {
    loadCommunications();
    setShowCommModal(false);
    setEditingComm(null);
  };

  const handleDeleteCommunication = async (commId) => {
    if (!window.confirm('Are you sure you want to delete this communication?')) {
      return;
    }

    try {
      await communicationService.delete(commId);
      loadCommunications();
      toast.success('Communication deleted successfully');
    } catch (error) {
      toast.error('Failed to delete communication');
      console.error('Delete communication error:', error);
    }
  };

  const getCommunicationIcon = (type) => {
    switch (type) {
      case 'call':
        return 'Phone';
      case 'email':
        return 'Mail';
      case 'meeting':
        return 'Calendar';
      default:
        return 'MessageSquare';
    }
  };

  const getCommunicationColor = (type, outcome) => {
    if (outcome === 'positive') return 'text-green-600 bg-green-50 border-green-200';
    if (outcome === 'negative') return 'text-red-600 bg-red-50 border-red-200';
    if (outcome === 'no_answer' || outcome === 'voicemail') return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    
    switch (type) {
      case 'call':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'email':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'meeting':
        return 'text-indigo-600 bg-indigo-50 border-indigo-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatDuration = (duration) => {
    if (!duration) return '';
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };
  const getTaskStatusColor = (task) => {
    if (task.status === 'completed') return 'border-l-green-500 bg-green-50';
    if (task.status === 'overdue' || (task.status === 'pending' && isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate)))) {
      return 'border-l-red-500 bg-red-50';
    }
    if (isToday(new Date(task.dueDate))) return 'border-l-yellow-500 bg-yellow-50';
    return 'border-l-blue-500 bg-white';
  };

  const getTaskTypeIcon = (type) => {
    switch (type) {
      case 'call': return 'Phone';
      case 'email': return 'Mail';
      case 'meeting': return 'Calendar';
      default: return 'CheckSquare';
    }
  };

  const formatTaskDueDate = (dueDate) => {
    const date = new Date(dueDate);
    if (isPast(date) && !isToday(date)) {
      return `Overdue - ${format(date, 'MMM dd, HH:mm')}`;
    }
    if (isToday(date)) {
      return `Today - ${format(date, 'HH:mm')}`;
    }
    return format(date, 'MMM dd, yyyy HH:mm');
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  return (
    <div className="max-h-[80vh] overflow-y-auto">
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center font-semibold text-lg">
              {lead.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold">{lead.name}</h2>
              <p className="text-gray-600">{lead.company}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <StatusBadge status={lead.status} />
            {!isEditing ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                disabled={loading}
              >
                <ApperIcon name="Edit" size={16} />
                Edit
              </Button>
            ) : (
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save'}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Contact Information */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <ApperIcon name="User" size={20} className="mr-2" />
            Contact Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Full Name">
              {isEditing ? (
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter full name"
                />
              ) : (
                <p className="text-gray-900">{lead.name}</p>
              )}
            </FormField>
            
            <FormField label="Email">
              {isEditing ? (
                <Input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter email address"
                />
              ) : (
                <p className="text-gray-900">{lead.email}</p>
              )}
            </FormField>
            
            <FormField label="Phone">
              {isEditing ? (
                <Input
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Enter phone number"
                />
              ) : (
                <p className="text-gray-900">{lead.phone}</p>
              )}
            </FormField>
            
            <FormField label="Company">
              {isEditing ? (
                <Input
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  placeholder="Enter company name"
                />
              ) : (
                <p className="text-gray-900">{lead.company}</p>
              )}
            </FormField>
            
            <FormField label="Title">
              {isEditing ? (
                <Input
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Enter job title"
                />
              ) : (
                <p className="text-gray-900">{lead.title || 'Not specified'}</p>
              )}
            </FormField>
            
            <FormField label="Address">
              {isEditing ? (
                <Input
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Enter address"
                />
              ) : (
                <p className="text-gray-900">{lead.address || 'Not specified'}</p>
              )}
            </FormField>
          </div>
        </Card>

        {/* Lead Details */}
<Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <ApperIcon name="Target" size={20} className="mr-2" />
            Lead Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Source">
              {isEditing ? (
                <Select
                  name="source"
                  value={formData.source}
                  onChange={handleInputChange}
                >
                  <option value="">Select source</option>
                  {sources.map(source => (
                    <option key={source.Id} value={source.name}>
                      {source.name}
                    </option>
                  ))}
                </Select>
              ) : (
                <p className="text-gray-900">{lead.source}</p>
              )}
            </FormField>
            
            <FormField label="Status">
              {isEditing ? (
                <Select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                >
                  {statusOptions.map(status => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </Select>
              ) : (
                <p className="text-gray-900">{lead.status}</p>
              )}
            </FormField>

            <FormField label="Assigned To">
              {isEditing ? (
                <Select
                  name="assignedUser"
                  value={formData.assignedUser}
                  onChange={handleInputChange}
                >
                  <option value="">Select team member</option>
                  {teamMembers.map(member => (
                    <option key={member.Id} value={member.name}>
                      {member.name} - {member.role}
                    </option>
                  ))}
                </Select>
              ) : (
                <div className="flex items-center space-x-2">
                  <span className="text-gray-900">{lead.assignedUser || 'Unassigned'}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="p-1 h-6 w-6"
                  >
                    <ApperIcon name="Edit2" size={12} />
                  </Button>
                </div>
              )}
            </FormField>
            
            <FormField label="Deal Value">
              {isEditing ? (
                <Input
                  name="value"
                  type="number"
                  value={formData.value}
                  onChange={handleInputChange}
                  placeholder="Enter deal value"
                />
              ) : (
                <p className="text-gray-900 font-semibold">{formatCurrency(lead.value)}</p>
              )}
            </FormField>
            
            <FormField label="Created">
              <p className="text-gray-900">
                {format(new Date(lead.createdAt), 'MMM dd, yyyy HH:mm')}
              </p>
            </FormField>
          </div>

          {customFields.length > 0 && (
            <div className="mt-6 pt-6 border-t">
              <h4 className="text-md font-medium text-gray-900 mb-4">Custom Fields</h4>
              {isEditing ? (
                <CustomFieldRenderer
                  customFields={customFields}
                  values={customFieldValues}
                  onChange={handleCustomFieldChange}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {customFields.map(field => {
                    const value = lead.customFields?.[field.name] || customFieldValues[field.name];
                    if (!value) return null;
                    
                    return (
                      <FormField key={field.Id} label={field.label}>
                        <p className="text-gray-900">
                          {field.type === "dropdown" && field.options
                            ? field.options.find(opt => opt.value === value)?.label || value
                            : field.type === "date"
                            ? format(new Date(value), 'MMM dd, yyyy')
                            : value}
                        </p>
                      </FormField>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </Card>

{/* Assignment History */}
        {assignmentHistory && assignmentHistory.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <ApperIcon name="Users" size={20} className="mr-2" />
              Assignment History
            </h3>
            <div className="space-y-3">
              {assignmentHistory.map((history, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between py-2 border-l-2 border-blue-200 pl-4"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div>
                      <span className="text-sm font-medium text-gray-900">
                        Assigned to {history.assignedUser}
                      </span>
                      <p className="text-xs text-gray-600">
                        by {history.assignedBy} • {history.reason}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">
                    {format(new Date(history.assignedAt), 'MMM dd, yyyy HH:mm')}
                  </span>
                </motion.div>
              ))}
            </div>
          </Card>
        )}

        {/* Status History */}
        {lead.statusHistory && lead.statusHistory.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <ApperIcon name="History" size={20} className="mr-2" />
              Status History
            </h3>
            <div className="space-y-3">
              {lead.statusHistory.map((history, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between py-2 border-l-2 border-gray-200 pl-4"
                >
                  <div className="flex items-center space-x-3">
                    <StatusBadge status={history.status} size="sm" />
                    <span className="text-sm text-gray-600">
                      Changed by {history.changedBy}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {format(new Date(history.changedAt), 'MMM dd, yyyy HH:mm')}
                  </span>
                </motion.div>
              ))}
            </div>
          </Card>
        )}

        {/* Notes Section */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <ApperIcon name="FileText" size={20} className="mr-2" />
            Notes
          </h3>
          
          {/* Add Note */}
          <div className="mb-6">
            <div className="flex space-x-2">
              <Input
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a note..."
                className="flex-1"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAddNote();
                  }
                }}
              />
              <Button
                onClick={handleAddNote}
                disabled={!newNote.trim() || loading}
                size="sm"
              >
                <ApperIcon name="Plus" size={16} />
                Add Note
              </Button>
            </div>
          </div>

          {/* Notes List */}
          {lead.notes && lead.notes.length > 0 ? (
            <div className="space-y-4">
              {lead.notes
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .map((note) => (
                  <motion.div
                    key={note.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-50 p-4 rounded-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {editingNote === note.id ? (
                          <div className="space-y-2">
                            <Input
                              value={editNoteContent}
                              onChange={(e) => setEditNoteContent(e.target.value)}
                              placeholder="Edit note..."
                              multiline
                              rows={3}
                            />
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                onClick={() => handleSaveNote(note.id)}
                                disabled={!editNoteContent.trim() || loading}
                              >
                                Save
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleCancelEditNote}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="text-gray-900 mb-2">{note.content}</p>
                            <div className="flex items-center text-sm text-gray-500">
                              <span>By {note.createdBy}</span>
                              <span className="mx-2">•</span>
                              <span>
                                {format(new Date(note.createdAt), 'MMM dd, yyyy HH:mm')}
                              </span>
                              {note.updatedAt && note.updatedAt !== note.createdAt && (
                                <>
                                  <span className="mx-2">•</span>
                                  <span>Edited</span>
                                </>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                      {editingNote !== note.id && (
                        <div className="flex space-x-1 ml-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditNote(note)}
                          >
                            <ApperIcon name="Edit" size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteNote(note.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <ApperIcon name="Trash2" size={14} />
                          </Button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
            </div>
) : (
            <div className="text-center py-8 text-gray-500">
              <ApperIcon name="FileText" size={48} className="mx-auto mb-2 opacity-50" />
              <p>No notes yet. Add the first note above.</p>
            </div>
          )}
        </Card>

        {/* Tasks Section */}
{/* Communication Timeline */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Communication Timeline</h3>
            <div className="flex items-center space-x-2">
              <Button onClick={() => handleCreateCommunication('call')} size="sm" variant="outline">
                <ApperIcon name="Phone" size={16} />
                Log Call
              </Button>
              <Button onClick={() => handleCreateCommunication('email')} size="sm" variant="outline">
                <ApperIcon name="Mail" size={16} />
                Log Email
              </Button>
              <Button onClick={() => handleCreateCommunication('meeting')} size="sm">
                <ApperIcon name="Calendar" size={16} />
                Log Meeting
              </Button>
            </div>
          </div>

          {communications.length > 0 ? (
            <div className="space-y-4">
              {communications.map((comm) => (
                <div
                  key={comm.Id}
                  className={`p-4 rounded-lg border-l-4 ${getCommunicationColor(comm.type, comm.outcome)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <ApperIcon 
                          name={getCommunicationIcon(comm.type)} 
                          size={14} 
                          className="text-gray-500" 
                        />
                        <h4 className="text-sm font-medium text-gray-900">
                          {comm.subject}
                        </h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          comm.outcome === 'positive' ? 'bg-green-100 text-green-600' :
                          comm.outcome === 'negative' ? 'bg-red-100 text-red-600' :
                          comm.outcome === 'neutral' ? 'bg-gray-100 text-gray-600' :
                          'bg-blue-100 text-blue-600'
                        }`}>
                          {comm.outcome.replace('_', ' ')}
                        </span>
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600 capitalize">
                          {comm.type}
                        </span>
                      </div>
                      
                      <p className="text-xs text-gray-600 mb-2">{comm.notes}</p>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span className="flex items-center space-x-1">
                          <ApperIcon name="Clock" size={12} />
                          <span>{format(new Date(comm.date), 'MMM dd, yyyy HH:mm')}</span>
                        </span>
                        {comm.duration && (
                          <span className="flex items-center space-x-1">
                            <ApperIcon name="Timer" size={12} />
                            <span>{formatDuration(comm.duration)}</span>
                          </span>
                        )}
                        <span className="flex items-center space-x-1">
                          <ApperIcon name="User" size={12} />
                          <span>{comm.createdBy}</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1 ml-2">
                      <Button
                        onClick={() => handleEditCommunication(comm)}
                        size="sm"
                        variant="ghost"
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <ApperIcon name="Edit2" size={14} />
                      </Button>
                      <Button
                        onClick={() => handleDeleteCommunication(comm.Id)}
                        size="sm"
                        variant="ghost"
                        className="text-gray-400 hover:text-red-600"
                      >
                        <ApperIcon name="Trash2" size={14} />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <ApperIcon name="MessageSquare" size={48} className="mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No communications recorded yet</p>
              <p className="text-xs">Start by logging a call, email, or meeting</p>
            </div>
          )}
        </Card>

        {/* Tasks & Activities */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Tasks & Activities</h3>
            <Button onClick={handleCreateTask} size="sm">
              <ApperIcon name="Plus" size={16} />
              Add Task
            </Button>
          </div>

          {tasks.length > 0 ? (
            <div className="space-y-4">
              {tasks.map((task) => (
                <div
                  key={task.Id}
                  className={`p-4 rounded-lg border-l-4 ${getTaskStatusColor(task)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <ApperIcon name={getTaskTypeIcon(task.type)} size={14} className="text-gray-500" />
                        <h4 className="text-sm font-medium text-gray-900">
                          {task.title}
                        </h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          task.priority === 'high' ? 'bg-red-100 text-red-600' :
                          task.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                          'bg-green-100 text-green-600'
                        }`}>
                          {task.priority}
                        </span>
                        {task.status === 'completed' && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-600">
                            Completed
                          </span>
                        )}
                      </div>
                      
                      {task.description && (
                        <p className="text-xs text-gray-600 mb-2">{task.description}</p>
                      )}
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span className="flex items-center space-x-1">
                          <ApperIcon name="Clock" size={12} />
                          <span className={isPast(new Date(task.dueDate)) && task.status !== 'completed' ? 'text-red-600 font-medium' : ''}>
                            {formatTaskDueDate(task.dueDate)}
                          </span>
                        </span>
                        {task.completedDate && (
                          <span className="flex items-center space-x-1 text-green-600">
                            <ApperIcon name="CheckCircle" size={12} />
                            <span>Completed {format(new Date(task.completedDate), 'MMM dd')}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {task.status === 'pending' || task.status === 'overdue' ? (
                      <Button
                        onClick={() => handleMarkTaskComplete(task.Id)}
                        size="sm"
                        variant="outline"
                        className="ml-2 flex-shrink-0 text-green-600 border-green-300 hover:bg-green-50"
                      >
                        <ApperIcon name="Check" size={14} />
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <ApperIcon name="CheckSquare" size={48} className="mx-auto mb-2 opacity-50" />
              <p>No tasks yet. Create the first task above.</p>
            </div>
          )}
        </Card>
</div>

      {/* Task Modal */}
<TaskModal
        isOpen={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        leadId={lead.Id}
        onTaskCreated={handleTaskCreated}
      />

      <CommunicationModal
        isOpen={showCommModal}
        onClose={() => setShowCommModal(false)}
        leadId={lead.Id}
        communication={editingComm}
        onCommunicationSaved={handleCommunicationSaved}
      />
    </div>
  );
};

export default LeadDetail;