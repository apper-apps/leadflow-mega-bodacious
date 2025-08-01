import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { format, isPast, isToday, isTomorrow } from 'date-fns';
import Button from '@/components/atoms/Button';
import Card from '@/components/atoms/Card';
import Input from '@/components/atoms/Input';
import Select from '@/components/atoms/Select';
import ApperIcon from '@/components/ApperIcon';
import SearchBar from '@/components/molecules/SearchBar';
import Loading from '@/components/ui/Loading';
import Empty from '@/components/ui/Empty';
import Error from '@/components/ui/Error';
import TaskModal from '@/components/organisms/TaskModal';
import { taskService } from '@/services/api/taskService';
import { leadService } from '@/services/api/leadService';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    priority: 'all',
    sortBy: 'dueDate'
  });
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [stats, setStats] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    searchTasks();
  }, [searchQuery, filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [leadsData, statsData] = await Promise.all([
        leadService.getAll(),
        taskService.getStats()
      ]);
      setLeads(leadsData);
      setStats(statsData);
      await searchTasks();
    } catch (err) {
      setError('Failed to load tasks');
      console.error('Load tasks error:', err);
    } finally {
      setLoading(false);
    }
  };

  const searchTasks = async () => {
    try {
      const tasksData = await taskService.search(searchQuery, filters);
      setTasks(tasksData);
    } catch (err) {
      console.error('Search tasks error:', err);
    }
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateTask = () => {
    setSelectedTask(null);
    setShowTaskModal(true);
  };

  const handleEditTask = (task) => {
    setSelectedTask(task);
    setShowTaskModal(true);
  };

  const handleTaskCreated = () => {
    loadData();
  };

  const handleTaskUpdated = () => {
    loadData();
  };

  const handleMarkComplete = async (taskId) => {
    try {
      await taskService.markComplete(taskId);
      toast.success('Task marked as complete');
      loadData();
    } catch (error) {
      toast.error('Failed to complete task');
      console.error('Complete task error:', error);
    }
  };

  const handleMarkPending = async (taskId) => {
    try {
      await taskService.markPending(taskId);
      toast.success('Task marked as pending');
      loadData();
    } catch (error) {
      toast.error('Failed to update task');
      console.error('Update task error:', error);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    try {
      await taskService.delete(taskId);
      toast.success('Task deleted successfully');
      loadData();
    } catch (error) {
      toast.error('Failed to delete task');
      console.error('Delete task error:', error);
    }
  };

  const getLeadName = (leadId) => {
    const lead = leads.find(l => l.Id === leadId);
    return lead ? `${lead.name} (${lead.company})` : 'Unknown Lead';
  };

  const getTaskStatusColor = (task) => {
    if (task.status === 'completed') return 'border-l-green-500 bg-green-50';
    if (task.status === 'overdue' || (task.status === 'pending' && isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate)))) {
      return 'border-l-red-500 bg-red-50';
    }
    if (isToday(new Date(task.dueDate))) return 'border-l-yellow-500 bg-yellow-50';
    return 'border-l-blue-500 bg-white';
  };

  const getTaskPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTaskTypeIcon = (type) => {
    switch (type) {
      case 'call': return 'Phone';
      case 'email': return 'Mail';
      case 'meeting': return 'Calendar';
      default: return 'CheckSquare';
    }
  };

  const formatDueDate = (dueDate) => {
    const date = new Date(dueDate);
    if (isPast(date) && !isToday(date)) {
      return `Overdue - ${format(date, 'MMM dd, HH:mm')}`;
    }
    if (isToday(date)) {
      return `Today - ${format(date, 'HH:mm')}`;
    }
    if (isTomorrow(date)) {
      return `Tomorrow - ${format(date, 'HH:mm')}`;
    }
    return format(date, 'MMM dd, yyyy HH:mm');
  };

  if (loading) return <Loading />;
  if (error) return <Error message={error} onRetry={loadData} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-600 mt-1">
            Manage your tasks and activities
          </p>
        </div>
        <Button onClick={handleCreateTask}>
          <ApperIcon name="Plus" size={16} />
          Create Task
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ApperIcon name="CheckSquare" size={20} className="text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Tasks</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <ApperIcon name="Clock" size={20} className="text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pending || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <ApperIcon name="AlertTriangle" size={20} className="text-red-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Overdue</p>
              <p className="text-2xl font-bold text-gray-900">{stats.overdue || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <ApperIcon name="CheckCircle" size={20} className="text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{stats.completed || 0}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex-1">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search tasks by title or description..."
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="min-w-32"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="overdue">Overdue</option>
            </Select>

            <Select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="min-w-32"
            >
              <option value="all">All Types</option>
              <option value="call">Calls</option>
              <option value="email">Emails</option>
              <option value="meeting">Meetings</option>
            </Select>

            <Select
              value={filters.priority}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
              className="min-w-32"
            >
              <option value="all">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </Select>

            <Select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="min-w-32"
            >
              <option value="dueDate">Due Date</option>
              <option value="priority">Priority</option>
              <option value="created">Created</option>
            </Select>
          </div>
        </div>
      </Card>

      {/* Tasks List */}
      <Card className="overflow-hidden">
        {tasks.length === 0 ? (
          <div className="p-8">
            <Empty
              icon="CheckSquare"
              title="No tasks found"
              message="Create your first task or adjust your filters to see more results."
              action={
                <Button onClick={handleCreateTask}>
                  <ApperIcon name="Plus" size={16} />
                  Create Task
                </Button>
              }
            />
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {tasks.map((task) => (
              <div
                key={task.Id}
                className={`p-6 border-l-4 hover:bg-gray-50 transition-colors duration-200 ${getTaskStatusColor(task)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <ApperIcon 
                        name={getTaskTypeIcon(task.type)} 
                        size={16} 
                        className="text-gray-500 flex-shrink-0" 
                      />
                      <h3 className="text-lg font-medium text-gray-900 truncate">
                        {task.title}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTaskPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                      {task.status === 'completed' && (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-600">
                          Completed
                        </span>
                      )}
                    </div>

                    {task.description && (
                      <p className="text-gray-600 mb-3 line-clamp-2">
                        {task.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center space-x-1">
                        <ApperIcon name="User" size={12} />
                        <span>{getLeadName(task.leadId)}</span>
                      </span>
                      
                      <span className="flex items-center space-x-1">
                        <ApperIcon name="Clock" size={12} />
                        <span className={isPast(new Date(task.dueDate)) && task.status !== 'completed' ? 'text-red-600 font-medium' : ''}>
                          {formatDueDate(task.dueDate)}
                        </span>
                      </span>

                      {task.completedDate && (
                        <span className="flex items-center space-x-1 text-green-600">
                          <ApperIcon name="CheckCircle" size={12} />
                          <span>Completed {format(new Date(task.completedDate), 'MMM dd, yyyy')}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    {task.status === 'pending' || task.status === 'overdue' ? (
                      <Button
                        onClick={() => handleMarkComplete(task.Id)}
                        size="sm"
                        variant="outline"
                        className="text-green-600 border-green-300 hover:bg-green-50"
                      >
                        <ApperIcon name="Check" size={14} />
                        Complete
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleMarkPending(task.Id)}
                        size="sm"
                        variant="outline"
                        className="text-yellow-600 border-yellow-300 hover:bg-yellow-50"
                      >
                        <ApperIcon name="RotateCcw" size={14} />
                        Reopen
                      </Button>
                    )}
                    
                    <Button
                      onClick={() => handleEditTask(task)}
                      size="sm"
                      variant="outline"
                    >
                      <ApperIcon name="Edit" size={14} />
                    </Button>
                    
                    <Button
                      onClick={() => handleDeleteTask(task.Id)}
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-300 hover:bg-red-50"
                    >
                      <ApperIcon name="Trash2" size={14} />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Task Modal */}
      <TaskModal
        isOpen={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        task={selectedTask}
        onTaskCreated={handleTaskCreated}
        onTaskUpdated={handleTaskUpdated}
      />
    </div>
  );
};

export default Tasks;