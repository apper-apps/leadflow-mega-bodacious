import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import ApperIcon from '@/components/ApperIcon';
import Button from '@/components/atoms/Button';
import Card from '@/components/atoms/Card';
import Input from '@/components/atoms/Input';
import Select from '@/components/atoms/Select';
import Badge from '@/components/atoms/Badge';
import Modal from '@/components/molecules/Modal';
import SearchBar from '@/components/molecules/SearchBar';
import StatusBadge from '@/components/molecules/StatusBadge';
import Loading from '@/components/ui/Loading';
import Error from '@/components/ui/Error';
import Empty from '@/components/ui/Empty';
import RuleBuilder from '@/components/organisms/RuleBuilder';
import { workflowService } from '@/services/api/workflowService';

const WorkflowAutomation = () => {
  const [rules, setRules] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [activity, setActivity] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('rules');
  
  // Rule management
  const [showRuleBuilder, setShowRuleBuilder] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  
  // Filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activityFilter, setActivityFilter] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rulesData, templatesData, activityData, statsData] = await Promise.all([
        workflowService.getAllRules(),
        workflowService.getAllTemplates(),
        workflowService.getActivity(),
        workflowService.getRuleStats()
      ]);
      
      setRules(rulesData);
      setTemplates(templatesData);
      setActivity(activityData);
      setStats(statsData);
    } catch (err) {
      setError('Failed to load workflow data');
      console.error('Load workflow data error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRule = () => {
    setEditingRule(null);
    setShowRuleBuilder(true);
  };

  const handleEditRule = (rule) => {
    setEditingRule(rule);
    setShowRuleBuilder(true);
  };

  const handleRuleSuccess = () => {
    setShowRuleBuilder(false);
    setEditingRule(null);
    loadData();
    toast.success('Rule saved successfully');
  };

  const handleToggleRule = async (ruleId, isActive) => {
    try {
      await workflowService.toggleRuleStatus(ruleId, !isActive);
      loadData();
      toast.success(`Rule ${!isActive ? 'activated' : 'deactivated'}`);
    } catch (error) {
      toast.error('Failed to update rule status');
      console.error('Toggle rule error:', error);
    }
  };

  const handleDeleteRule = async (ruleId) => {
    if (!window.confirm('Are you sure you want to delete this rule? This action cannot be undone.')) {
      return;
    }

    try {
      await workflowService.deleteRule(ruleId);
      loadData();
      toast.success('Rule deleted successfully');
    } catch (error) {
      toast.error('Failed to delete rule');
      console.error('Delete rule error:', error);
    }
  };

  const handleUseTemplate = (template) => {
    setSelectedTemplate(template);
    setShowTemplateModal(false);
    setEditingRule({
      name: template.name,
      description: template.description,
      trigger: template.trigger,
      actions: template.actions,
      isActive: true,
      priority: 1
    });
    setShowRuleBuilder(true);
  };

  const filteredRules = rules.filter(rule => {
    const matchesSearch = rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rule.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && rule.isActive) ||
                         (statusFilter === 'inactive' && !rule.isActive);
    return matchesSearch && matchesStatus;
  });

  const filteredActivity = activity.filter(act => {
    const matchesSearch = act.ruleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         act.leadName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = activityFilter === 'all' || act.status === activityFilter;
    return matchesSearch && matchesStatus;
  });

  const getRuleStatusColor = (isActive) => {
    return isActive ? 'text-green-600 bg-green-100' : 'text-gray-600 bg-gray-100';
  };

  const getActivityStatusColor = (status) => {
    return status === 'success' ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100';
  };

const getActionIcon = (actionType) => {
    switch (actionType) {
      case 'assign_user': return 'User';
      case 'set_status': return 'Flag';
      case 'add_tag': return 'Tag';
      case 'set_priority': return 'AlertTriangle';
      case 'add_note': return 'FileText';
      case 'create_task': return 'CheckSquare';
      case 'send_notification': return 'Bell';
      case 'update_field': return 'Edit';
      default: return 'Zap';
    }
  };

  const formatActionValue = (actionType, value) => {
    switch (actionType) {
      case 'assign_user': return `Assigned to ${value}`;
      case 'set_status': return `Status changed to ${value}`;
      case 'add_tag': return `Tagged as ${value}`;
      case 'set_priority': return `Priority set to ${value}`;
      case 'add_note': return `Note added: ${value.substring(0, 50)}...`;
      case 'create_task': return `Task created: ${value.substring(0, 50)}...`;
      case 'send_notification': return `Notification sent: ${value.substring(0, 50)}...`;
      case 'update_field': return `Field updated: ${value}`;
      default: return value;
    }
  };

  if (loading) return <Loading />;
  if (error) return <Error message={error} onRetry={loadData} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Workflow Automation</h1>
          <p className="text-gray-600 mt-1">Automate lead assignment and management processes</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={() => setShowTemplateModal(true)}
            className="flex items-center space-x-2"
          >
            <ApperIcon name="Layout" size={16} />
            <span>Templates</span>
          </Button>
          <Button
            onClick={handleCreateRule}
            className="flex items-center space-x-2"
          >
            <ApperIcon name="Plus" size={16} />
            <span>Create Rule</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <ApperIcon name="Zap" size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Rules</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalRules}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <ApperIcon name="CheckCircle" size={20} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Rules</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeRules}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <ApperIcon name="Activity" size={20} className="text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Executions</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalActivity}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <ApperIcon name="TrendingUp" size={20} className="text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalActivity > 0 ? Math.round((stats.successfulRuns / stats.totalActivity) * 100) : 0}%
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('rules')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'rules'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Rules ({rules.length})
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'activity'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Activity ({activity.length})
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'rules' && (
        <div className="space-y-4">
          {/* Filters */}
          <Card className="p-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <SearchBar
                  value={searchTerm}
                  onChange={setSearchTerm}
                  placeholder="Search rules..."
                />
              </div>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-48"
              >
                <option value="all">All Rules</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </Select>
            </div>
          </Card>

          {/* Rules List */}
          {filteredRules.length > 0 ? (
            <div className="space-y-4">
              {filteredRules.map((rule) => (
                <motion.div
                  key={rule.Id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-lg border border-gray-200 p-6"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{rule.name}</h3>
                        <Badge className={getRuleStatusColor(rule.isActive)}>
                          {rule.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        {rule.priority && (
                          <Badge variant="outline" className="text-xs">
                            Priority {rule.priority}
                          </Badge>
                        )}
                      </div>
                      <p className="text-gray-600 mb-3">{rule.description}</p>
                      
                      {/* Rule Summary */}
                      <div className="flex items-center space-x-6 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <ApperIcon name="Filter" size={14} />
                          <span>{rule.trigger.conditions.length} condition{rule.trigger.conditions.length !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <ApperIcon name="Zap" size={14} />
                          <span>{rule.actions.length} action{rule.actions.length !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <ApperIcon name="Clock" size={14} />
                          <span>Created {format(new Date(rule.createdAt), 'MMM dd, yyyy')}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleRule(rule.Id, rule.isActive)}
                        className={rule.isActive ? 'text-yellow-600 hover:text-yellow-700' : 'text-green-600 hover:text-green-700'}
                      >
                        <ApperIcon name={rule.isActive ? 'Pause' : 'Play'} size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditRule(rule)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <ApperIcon name="Edit" size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteRule(rule.Id)}
                        className="text-gray-400 hover:text-red-600"
                      >
                        <ApperIcon name="Trash2" size={16} />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <Empty
              icon="Zap"
              title="No rules found"
              description="Create automation rules to streamline your lead management process."
              action={
                <Button onClick={handleCreateRule} className="mt-4">
                  <ApperIcon name="Plus" size={16} className="mr-2" />
                  Create First Rule
                </Button>
              }
            />
          )}
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="space-y-4">
          {/* Filters */}
          <Card className="p-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <SearchBar
                  value={searchTerm}
                  onChange={setSearchTerm}
                  placeholder="Search activity..."
                />
              </div>
              <Select
                value={activityFilter}
                onChange={(e) => setActivityFilter(e.target.value)}
                className="w-48"
              >
                <option value="all">All Activity</option>
                <option value="success">Successful Only</option>
                <option value="error">Errors Only</option>
              </Select>
            </div>
          </Card>

          {/* Activity List */}
          {filteredActivity.length > 0 ? (
            <Card className="divide-y divide-gray-200">
              {filteredActivity.map((act) => (
                <motion.div
                  key={act.Id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-4 hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getActivityStatusColor(act.status)}`}>
                        <ApperIcon name={getActionIcon(act.action)} size={14} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {act.ruleName}
                        </p>
                        <p className="text-sm text-gray-600">
                          {formatActionValue(act.action, act.actionValue)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Lead: {act.leadName}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={getActivityStatusColor(act.status)}>
                        {act.status}
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1">
                        {format(new Date(act.triggeredAt), 'MMM dd, HH:mm')}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </Card>
          ) : (
            <Empty
              icon="Activity"
              title="No activity found"
              description="Workflow activity will appear here when rules are triggered."
            />
          )}
        </div>
      )}

      {/* Rule Builder Modal */}
      <Modal
        isOpen={showRuleBuilder}
        onClose={() => setShowRuleBuilder(false)}
        title={editingRule ? 'Edit Rule' : 'Create New Rule'}
        size="xl"
      >
        <RuleBuilder
          rule={editingRule}
          onSuccess={handleRuleSuccess}
          onCancel={() => setShowRuleBuilder(false)}
        />
      </Modal>

      {/* Templates Modal */}
      <Modal
        isOpen={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        title="Rule Templates"
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Choose from pre-built templates to quickly create common automation rules.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((template) => (
              <div
                key={template.Id}
                className="border border-gray-200 rounded-lg p-4 hover:border-primary cursor-pointer transition-colors"
                onClick={() => handleUseTemplate(template)}
              >
                <h4 className="font-semibold text-gray-900 mb-2">{template.name}</h4>
                <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                <Badge variant="outline" className="text-xs">
                  {template.category}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default WorkflowAutomation;