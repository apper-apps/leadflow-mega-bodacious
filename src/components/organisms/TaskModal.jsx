import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import Modal from '@/components/molecules/Modal';
import FormField from '@/components/molecules/FormField';
import Button from '@/components/atoms/Button';
import Input from '@/components/atoms/Input';
import Select from '@/components/atoms/Select';
import ApperIcon from '@/components/ApperIcon';
import { taskService } from '@/services/api/taskService';
import { leadService } from '@/services/api/leadService';

const TaskModal = ({ isOpen, onClose, task, leadId, onTaskCreated, onTaskUpdated }) => {
  const [loading, setLoading] = useState(false);
  const [leads, setLeads] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'call',
    priority: 'medium',
    leadId: leadId || '',
    dueDate: '',
    remindAt: ''
  });

  const taskTypes = [
    { value: 'call', label: 'Call' },
    { value: 'email', label: 'Email' },
    { value: 'meeting', label: 'Meeting' }
  ];

  const priorities = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' }
  ];

  useEffect(() => {
    if (isOpen) {
      loadLeads();
      if (task) {
        // Editing existing task
        setFormData({
          title: task.title || '',
          description: task.description || '',
          type: task.type || 'call',
          priority: task.priority || 'medium',
          leadId: task.leadId?.toString() || '',
          dueDate: task.dueDate ? format(new Date(task.dueDate), "yyyy-MM-dd'T'HH:mm") : '',
          remindAt: task.remindAt ? format(new Date(task.remindAt), "yyyy-MM-dd'T'HH:mm") : ''
        });
      } else {
        // Creating new task
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(9, 0, 0, 0);
        
        const reminderTime = new Date(tomorrow);
        reminderTime.setMinutes(reminderTime.getMinutes() - 30);

        setFormData({
          title: '',
          description: '',
          type: 'call',
          priority: 'medium',
          leadId: leadId?.toString() || '',
          dueDate: format(tomorrow, "yyyy-MM-dd'T'HH:mm"),
          remindAt: format(reminderTime, "yyyy-MM-dd'T'HH:mm")
        });
      }
    }
  }, [isOpen, task, leadId]);

  const loadLeads = async () => {
    try {
      const leadsData = await leadService.getAll();
      setLeads(leadsData);
    } catch (error) {
      console.error('Failed to load leads:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Task title is required');
      return;
    }

    if (!formData.leadId) {
      toast.error('Please select a lead');
      return;
    }

    if (!formData.dueDate) {
      toast.error('Due date is required');
      return;
    }

    setLoading(true);
    try {
      const taskData = {
        ...formData,
        dueDate: new Date(formData.dueDate).toISOString(),
        remindAt: formData.remindAt ? new Date(formData.remindAt).toISOString() : null
      };

      if (task) {
        // Update existing task
        await taskService.update(task.Id, taskData);
        toast.success('Task updated successfully');
        onTaskUpdated && onTaskUpdated();
      } else {
        // Create new task
        await taskService.create(taskData);
        toast.success('Task created successfully');
        onTaskCreated && onTaskCreated();
      }
      
      onClose();
    } catch (error) {
      console.error('Task operation error:', error);
      toast.error(task ? 'Failed to update task' : 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high': return 'AlertTriangle';
      case 'medium': return 'Clock';
      case 'low': return 'ArrowDown';
      default: return 'Clock';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'call': return 'Phone';
      case 'email': return 'Mail';
      case 'meeting': return 'Calendar';
      default: return 'CheckSquare';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center space-x-2">
          <ApperIcon name={task ? 'Edit' : 'Plus'} size={20} />
          <span>{task ? 'Edit Task' : 'Create New Task'}</span>
        </div>
      }
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Task Title */}
          <div className="md:col-span-2">
            <FormField
              label="Task Title"
              required
              error={!formData.title.trim() ? 'Title is required' : ''}
            >
              <Input
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter task title"
                className="w-full"
              />
            </FormField>
          </div>

          {/* Task Type */}
          <FormField label="Task Type" required>
            <Select
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className="w-full"
            >
              {taskTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </Select>
          </FormField>

          {/* Priority */}
          <FormField label="Priority" required>
            <Select
              name="priority"
              value={formData.priority}
              onChange={handleInputChange}
              className="w-full"
            >
              {priorities.map(priority => (
                <option key={priority.value} value={priority.value}>
                  {priority.label}
                </option>
              ))}
            </Select>
          </FormField>

          {/* Lead Selection */}
          <FormField label="Associated Lead" required>
            <Select
              name="leadId"
              value={formData.leadId}
              onChange={handleInputChange}
              className="w-full"
            >
              <option value="">Select a lead</option>
              {leads.map(lead => (
                <option key={lead.Id} value={lead.Id}>
                  {lead.name} ({lead.company})
                </option>
              ))}
            </Select>
          </FormField>

          {/* Due Date */}
          <FormField label="Due Date" required>
            <Input
              type="datetime-local"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleInputChange}
              className="w-full"
            />
          </FormField>

          {/* Reminder Time */}
          <div className="md:col-span-2">
            <FormField label="Reminder Time">
              <Input
                type="datetime-local"
                name="remindAt"
                value={formData.remindAt}
                onChange={handleInputChange}
                className="w-full"
                placeholder="Optional reminder time"
              />
            </FormField>
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <FormField label="Description">
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Enter task description (optional)"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              />
            </FormField>
          </div>
        </div>

        {/* Task Preview */}
        <div className="bg-gray-50 rounded-lg p-4 border">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Task Preview:</h4>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <ApperIcon name={getTypeIcon(formData.type)} size={14} />
              <span className="capitalize">{formData.type}</span>
            </div>
            <div className="flex items-center space-x-1">
              <ApperIcon name={getPriorityIcon(formData.priority)} size={14} />
              <span className="capitalize">{formData.priority} Priority</span>
            </div>
            {formData.dueDate && (
              <div className="flex items-center space-x-1">
                <ApperIcon name="Calendar" size={14} />
                <span>Due: {format(new Date(formData.dueDate), 'MMM dd, yyyy HH:mm')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={loading}
            disabled={!formData.title.trim() || !formData.leadId || !formData.dueDate}
          >
            <ApperIcon name={task ? 'Save' : 'Plus'} size={16} />
            {task ? 'Update Task' : 'Create Task'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default TaskModal;