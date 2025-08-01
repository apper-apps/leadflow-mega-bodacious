import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import ApperIcon from '@/components/ApperIcon';
import Button from '@/components/atoms/Button';
import Input from '@/components/atoms/Input';
import Select from '@/components/atoms/Select';
import FormField from '@/components/molecules/FormField';
import Modal from '@/components/molecules/Modal';
import { communicationService } from '@/services/api/communicationService';

const CommunicationModal = ({ 
  isOpen, 
  onClose, 
  leadId, 
  communication = null, 
  onCommunicationSaved 
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: 'call',
    subject: '',
    date: new Date().toISOString().slice(0, 16),
    duration: '',
    outcome: '',
    notes: ''
  });
  const [errors, setErrors] = useState({});

  const communicationTypes = [
    { value: 'call', label: 'Phone Call' },
    { value: 'email', label: 'Email' },
    { value: 'meeting', label: 'Meeting' }
  ];

  const callOutcomes = [
    { value: 'positive', label: 'Positive' },
    { value: 'neutral', label: 'Neutral' },
    { value: 'negative', label: 'Negative' },
    { value: 'no_answer', label: 'No Answer' },
    { value: 'voicemail', label: 'Voicemail Left' }
  ];

  const emailOutcomes = [
    { value: 'sent', label: 'Sent' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'opened', label: 'Opened' },
    { value: 'replied', label: 'Replied' },
    { value: 'bounced', label: 'Bounced' }
  ];

  const meetingOutcomes = [
    { value: 'completed', label: 'Completed' },
    { value: 'positive', label: 'Positive' },
    { value: 'neutral', label: 'Neutral' },
    { value: 'rescheduled', label: 'Rescheduled' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  useEffect(() => {
    if (communication) {
      setFormData({
        type: communication.type || 'call',
        subject: communication.subject || '',
        date: communication.date ? new Date(communication.date).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
        duration: communication.duration?.toString() || '',
        outcome: communication.outcome || '',
        notes: communication.notes || ''
      });
    } else {
      setFormData({
        type: 'call',
        subject: '',
        date: new Date().toISOString().slice(0, 16),
        duration: '',
        outcome: '',
        notes: ''
      });
    }
    setErrors({});
  }, [communication, isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Reset outcome when type changes
    if (name === 'type') {
      setFormData(prev => ({
        ...prev,
        outcome: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    if (!formData.outcome) {
      newErrors.outcome = 'Outcome is required';
    }

    if (formData.type === 'call' && formData.duration && isNaN(parseInt(formData.duration))) {
      newErrors.duration = 'Duration must be a number';
    }

    if (!formData.notes.trim()) {
      newErrors.notes = 'Notes are required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getOutcomeOptions = () => {
    switch (formData.type) {
      case 'call':
        return callOutcomes;
      case 'email':
        return emailOutcomes;
      case 'meeting':
        return meetingOutcomes;
      default:
        return callOutcomes;
    }
  };

  const getTypeIcon = (type) => {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const communicationData = {
        leadId: parseInt(leadId),
        type: formData.type,
        subject: formData.subject.trim(),
        date: new Date(formData.date).toISOString(),
        outcome: formData.outcome,
        notes: formData.notes.trim(),
        createdBy: 'Sales Rep'
      };

      // Add duration for calls and meetings
      if ((formData.type === 'call' || formData.type === 'meeting') && formData.duration) {
        communicationData.duration = parseInt(formData.duration);
      }

      let savedCommunication;
      if (communication) {
        savedCommunication = await communicationService.update(communication.Id, communicationData);
        toast.success('Communication updated successfully');
      } else {
        savedCommunication = await communicationService.create(communicationData);
        toast.success('Communication logged successfully');
      }

      if (onCommunicationSaved) {
        onCommunicationSaved(savedCommunication);
      }
      
      onClose();
    } catch (error) {
      toast.error(communication ? 'Failed to update communication' : 'Failed to log communication');
      console.error('Communication save error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      type: 'call',
      subject: '',
      date: new Date().toISOString().slice(0, 16),
      duration: '',
      outcome: '',
      notes: ''
    });
    setErrors({});
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <ApperIcon name={getTypeIcon(formData.type)} size={20} className="text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {communication ? 'Edit Communication' : 'Log Communication'}
              </h2>
              <p className="text-sm text-gray-500">
                {communication ? 'Update communication details' : 'Record interaction with this lead'}
              </p>
            </div>
          </div>
          <Button
            onClick={handleClose}
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-gray-600"
          >
            <ApperIcon name="X" size={20} />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Communication Type"
              error={errors.type}
              required
            >
              <Select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                options={communicationTypes}
                className={errors.type ? 'border-red-300' : ''}
              />
            </FormField>

            <FormField
              label="Date & Time"
              error={errors.date}
              required
            >
              <Input
                type="datetime-local"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                className={errors.date ? 'border-red-300' : ''}
              />
            </FormField>
          </div>

          <FormField
            label="Subject"
            error={errors.subject}
            required
          >
            <Input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleInputChange}
              placeholder={`Enter ${formData.type} subject...`}
              className={errors.subject ? 'border-red-300' : ''}
            />
          </FormField>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(formData.type === 'call' || formData.type === 'meeting') && (
              <FormField
                label="Duration (minutes)"
                error={errors.duration}
              >
                <Input
                  type="number"
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  placeholder="Enter duration..."
                  min="1"
                  className={errors.duration ? 'border-red-300' : ''}
                />
              </FormField>
            )}

            <FormField
              label="Outcome"
              error={errors.outcome}
              required
            >
              <Select
                name="outcome"
                value={formData.outcome}
                onChange={handleInputChange}
                options={getOutcomeOptions()}
                placeholder="Select outcome..."
                className={errors.outcome ? 'border-red-300' : ''}
              />
            </FormField>
          </div>

          <FormField
            label="Notes"
            error={errors.notes}
            required
          >
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={4}
              placeholder="Enter detailed notes about this communication..."
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none ${
                errors.notes ? 'border-red-300' : ''
              }`}
            />
          </FormField>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={loading}
              className="min-w-[120px]"
            >
              {communication ? 'Update' : 'Log'} Communication
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default CommunicationModal;