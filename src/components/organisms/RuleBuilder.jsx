import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import ApperIcon from '@/components/ApperIcon';
import Button from '@/components/atoms/Button';
import Card from '@/components/atoms/Card';
import Input from '@/components/atoms/Input';
import Select from '@/components/atoms/Select';
import FormField from '@/components/molecules/FormField';
import { workflowService } from '@/services/api/workflowService';
import { leadSourceService } from '@/services/api/leadSourceService';
import { teamMemberService } from '@/services/api/teamMemberService';

const RuleBuilder = ({ rule, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true,
    priority: 1,
    trigger: {
      type: 'lead_created',
      conditions: []
    },
    actions: []
  });
  
  const [sources, setSources] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [showTest, setShowTest] = useState(false);

  const fieldOptions = [
    { value: 'source', label: 'Lead Source' },
    { value: 'status', label: 'Status' },
    { value: 'value', label: 'Deal Value' },
    { value: 'assignedUser', label: 'Assigned User' },
    { value: 'company', label: 'Company' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone' },
    { value: 'address', label: 'Address' }
  ];

  const operatorOptions = [
    { value: 'equals', label: 'Equals' },
    { value: 'not_equals', label: 'Not Equals' },
    { value: 'contains', label: 'Contains' },
    { value: 'not_contains', label: 'Does Not Contain' },
    { value: 'greater_than', label: 'Greater Than' },
    { value: 'less_than', label: 'Less Than' },
    { value: 'greater_than_equal', label: 'Greater Than or Equal' },
    { value: 'less_than_equal', label: 'Less Than or Equal' },
    { value: 'is_empty', label: 'Is Empty' },
    { value: 'is_not_empty', label: 'Is Not Empty' }
  ];

  const actionTypes = [
    { value: 'assign_user', label: 'Assign to User' },
    { value: 'set_status', label: 'Set Status' },
    { value: 'add_tag', label: 'Add Tag' },
    { value: 'set_priority', label: 'Set Priority' },
    { value: 'add_note', label: 'Add Note' }
  ];

  const statusOptions = ['New', 'Contacted', 'Qualified', 'Proposal', 'Won', 'Lost'];
  const priorityOptions = ['Low', 'Medium', 'High'];

  useEffect(() => {
    loadData();
    if (rule) {
      setFormData({ ...rule });
    }
  }, [rule]);

  const loadData = async () => {
    try {
      const [sourcesData, membersData] = await Promise.all([
        leadSourceService.getAll(),
        teamMemberService.getActive()
      ]);
      setSources(sourcesData);
      setTeamMembers(membersData);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'priority' ? parseInt(value) : value
    }));
  };

  const handleTriggerTypeChange = (e) => {
    setFormData(prev => ({
      ...prev,
      trigger: {
        ...prev.trigger,
        type: e.target.value
      }
    }));
  };

  const addCondition = () => {
    setFormData(prev => ({
      ...prev,
      trigger: {
        ...prev.trigger,
        conditions: [
          ...prev.trigger.conditions,
          { field: '', operator: 'equals', value: '' }
        ]
      }
    }));
  };

  const updateCondition = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      trigger: {
        ...prev.trigger,
        conditions: prev.trigger.conditions.map((condition, i) =>
          i === index ? { ...condition, [field]: value } : condition
        )
      }
    }));
  };

  const removeCondition = (index) => {
    setFormData(prev => ({
      ...prev,
      trigger: {
        ...prev.trigger,
        conditions: prev.trigger.conditions.filter((_, i) => i !== index)
      }
    }));
  };

  const addAction = () => {
    setFormData(prev => ({
      ...prev,
      actions: [
        ...prev.actions,
        { type: 'assign_user', value: '' }
      ]
    }));
  };

  const updateAction = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      actions: prev.actions.map((action, i) =>
        i === index ? { ...action, [field]: value } : action
      )
    }));
  };

  const removeAction = (index) => {
    setFormData(prev => ({
      ...prev,
      actions: prev.actions.filter((_, i) => i !== index)
    }));
  };

  const getValueOptions = (field) => {
    switch (field) {
      case 'source':
        return sources.map(s => ({ value: s.name, label: s.name }));
      case 'status':
        return statusOptions.map(s => ({ value: s, label: s }));
      case 'assignedUser':
        return teamMembers.map(m => ({ value: m.name, label: `${m.name} - ${m.role}` }));
      default:
        return [];
    }
  };

  const getActionValueOptions = (actionType) => {
    switch (actionType) {
      case 'assign_user':
        return teamMembers.map(m => ({ value: m.name, label: `${m.name} - ${m.role}` }));
      case 'set_status':
        return statusOptions.map(s => ({ value: s, label: s }));
      case 'set_priority':
        return priorityOptions.map(p => ({ value: p, label: p }));
      default:
        return [];
    }
  };

  const needsValueInput = (operator) => {
    return !['is_empty', 'is_not_empty'].includes(operator);
  };

  const isNumericField = (field) => {
    return ['value', 'priority'].includes(field);
  };

  const handleTest = async () => {
    const validation = await workflowService.validateRule(formData);
    if (!validation.isValid) {
      toast.error(validation.errors[0]);
      return;
    }

    // Create a test lead
    const testLead = {
      Id: 999999,
      name: 'Test Lead',
      source: 'Website',
      status: 'New',
      value: 25000,
      assignedUser: null,
      company: 'Test Company',
      email: 'test@example.com'
    };

    try {
      const result = await workflowService.testRule(formData, testLead);
      setTestResult(result);
      setShowTest(true);
    } catch (error) {
      toast.error('Failed to test rule');
      console.error('Test rule error:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validation = await workflowService.validateRule(formData);
      if (!validation.isValid) {
        toast.error(validation.errors[0]);
        return;
      }

      if (rule) {
        await workflowService.updateRule(rule.Id, formData);
      } else {
        await workflowService.createRule(formData);
      }

      onSuccess();
    } catch (error) {
      toast.error('Failed to save rule');
      console.error('Save rule error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Rule Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Rule Name" required>
              <Input
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter rule name"
                required
              />
            </FormField>
            
            <FormField label="Priority">
              <Input
                name="priority"
                type="number"
                min="1"
                max="999"
                value={formData.priority}
                onChange={handleInputChange}
                placeholder="1"
              />
            </FormField>
          </div>
          
          <FormField label="Description" className="mt-4">
            <Input
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe what this rule does"
              multiline
              rows={2}
            />
          </FormField>
        </Card>

        {/* Trigger Configuration */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">When (Trigger)</h3>
            <Select
              value={formData.trigger.type}
              onChange={handleTriggerTypeChange}
              className="w-48"
            >
              <option value="lead_created">Lead is Created</option>
              <option value="lead_updated">Lead is Updated</option>
            </Select>
          </div>
          
          <div className="space-y-4">
            {formData.trigger.conditions.map((condition, index) => (
              <div key={index} className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                <Select
                  value={condition.field}
                  onChange={(e) => updateCondition(index, 'field', e.target.value)}
                  className="flex-1"
                >
                  <option value="">Select Field</option>
                  {fieldOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
                
                <Select
                  value={condition.operator}
                  onChange={(e) => updateCondition(index, 'operator', e.target.value)}
                  className="flex-1"
                >
                  {operatorOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
                
                {needsValueInput(condition.operator) && (
                  <div className="flex-1">
                    {getValueOptions(condition.field).length > 0 ? (
                      <Select
                        value={condition.value}
                        onChange={(e) => updateCondition(index, 'value', e.target.value)}
                      >
                        <option value="">Select Value</option>
                        {getValueOptions(condition.field).map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </Select>
                    ) : (
                      <Input
                        type={isNumericField(condition.field) ? 'number' : 'text'}
                        value={condition.value}
                        onChange={(e) => updateCondition(index, 'value', e.target.value)}
                        placeholder="Enter value"
                      />
                    )}
                  </div>
                )}
                
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeCondition(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <ApperIcon name="Trash2" size={16} />
                </Button>
              </div>
            ))}
            
            <Button
              type="button"
              variant="outline"
              onClick={addCondition}
              className="w-full"
            >
              <ApperIcon name="Plus" size={16} className="mr-2" />
              Add Condition
            </Button>
          </div>
        </Card>

        {/* Actions Configuration */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Then (Actions)</h3>
          </div>
          
          <div className="space-y-4">
            {formData.actions.map((action, index) => (
              <div key={index} className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                <Select
                  value={action.type}
                  onChange={(e) => updateAction(index, 'type', e.target.value)}
                  className="flex-1"
                >
                  {actionTypes.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
                
                <div className="flex-1">
                  {getActionValueOptions(action.type).length > 0 ? (
                    <Select
                      value={action.value}
                      onChange={(e) => updateAction(index, 'value', e.target.value)}
                    >
                      <option value="">Select Value</option>
                      {getActionValueOptions(action.type).map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  ) : (
                    <Input
                      value={action.value}
                      onChange={(e) => updateAction(index, 'value', e.target.value)}
                      placeholder={action.type === 'add_note' ? 'Enter note content' : 'Enter value'}
                      multiline={action.type === 'add_note'}
                      rows={action.type === 'add_note' ? 2 : 1}
                    />
                  )}
                </div>
                
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeAction(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <ApperIcon name="Trash2" size={16} />
                </Button>
              </div>
            ))}
            
            <Button
              type="button"
              variant="outline"
              onClick={addAction}
              className="w-full"
            >
              <ApperIcon name="Plus" size={16} className="mr-2" />
              Add Action
            </Button>
          </div>
        </Card>

        {/* Test Results */}
        {showTest && testResult && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Test Results</h3>
            <div className={`p-4 rounded-lg ${testResult.matches ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex items-center space-x-2 mb-2">
                <ApperIcon 
                  name={testResult.matches ? 'CheckCircle' : 'XCircle'} 
                  size={20} 
                  className={testResult.matches ? 'text-green-600' : 'text-red-600'} 
                />
                <span className={`font-medium ${testResult.matches ? 'text-green-900' : 'text-red-900'}`}>
                  {testResult.message}
                </span>
              </div>
              {testResult.matches && (
                <div className="text-sm text-gray-600 mt-2">
                  <p><strong>Actions that would be executed:</strong></p>
                  <ul className="list-disc list-inside mt-1">
                    {formData.actions.map((action, index) => (
                      <li key={index}>
                        {actionTypes.find(t => t.value === action.type)?.label}: {action.value}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Form Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <div className="flex items-center space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleTest}
              disabled={loading}
            >
              <ApperIcon name="Play" size={16} className="mr-2" />
              Test Rule
            </Button>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? 'Saving...' : rule ? 'Update Rule' : 'Create Rule'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default RuleBuilder;