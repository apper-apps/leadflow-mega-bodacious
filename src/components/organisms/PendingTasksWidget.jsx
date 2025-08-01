import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { format, isToday, isTomorrow, isPast } from 'date-fns';
import Card from '@/components/atoms/Card';
import Button from '@/components/atoms/Button';
import ApperIcon from '@/components/ApperIcon';
import Loading from '@/components/ui/Loading';
import Empty from '@/components/ui/Empty';
import { taskService } from '@/services/api/taskService';
import { leadService } from '@/services/api/leadService';

const PendingTasksWidget = ({ onTaskClick, onCreateTask }) => {
  const [tasks, setTasks] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [tasksData, leadsData] = await Promise.all([
        taskService.getPending(),
        leadService.getAll()
      ]);
      setTasks(tasksData.slice(0, 5)); // Show only first 5 tasks
      setLeads(leadsData);
    } catch (err) {
      setError('Failed to load tasks');
      console.error('Load tasks error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getLeadName = (leadId) => {
    const lead = leads.find(l => l.Id === leadId);
    return lead ? `${lead.name} (${lead.company})` : 'Unknown Lead';
  };

  const handleMarkComplete = async (taskId, e) => {
    e.stopPropagation(); // Prevent task click
    try {
      await taskService.markComplete(taskId);
      toast.success('Task marked as complete');
      loadData(); // Reload tasks
    } catch (error) {
      toast.error('Failed to complete task');
      console.error('Complete task error:', error);
    }
  };

  const getTaskPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
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

  const getTaskStatusColor = (task) => {
    if (task.status === 'overdue' || (task.status === 'pending' && isPast(new Date(task.dueDate)))) {
      return 'border-l-red-500 bg-red-50';
    }
    if (isToday(new Date(task.dueDate))) {
      return 'border-l-yellow-500 bg-yellow-50';
    }
    return 'border-l-blue-500 bg-white';
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
    return format(date, 'MMM dd, HH:mm');
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Pending Tasks</h3>
        </div>
        <Loading size="sm" />
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Pending Tasks</h3>
        </div>
        <div className="text-center py-4">
          <p className="text-red-600 mb-2">{error}</p>
          <Button onClick={loadData} size="sm" variant="outline">
            <ApperIcon name="RefreshCw" size={14} />
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Pending Tasks</h3>
        <Button onClick={onCreateTask} size="sm">
          <ApperIcon name="Plus" size={14} />
          Add Task
        </Button>
      </div>

      {tasks.length === 0 ? (
        <Empty
          icon="CheckSquare"
          title="No pending tasks"
          message="All caught up! Create a new task to get started."
          action={
            <Button onClick={onCreateTask} size="sm">
              <ApperIcon name="Plus" size={14} />
              Create Task
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task.Id}
              onClick={() => onTaskClick && onTaskClick(task)}
              className={`p-4 rounded-lg border-l-4 cursor-pointer hover:shadow-md transition-all duration-200 ${getTaskStatusColor(task)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <ApperIcon name={getTaskTypeIcon(task.type)} size={14} className="text-gray-500" />
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {task.title}
                    </h4>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTaskPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  </div>
                  
                  <div className="text-xs text-gray-600 mb-2">
                    {getLeadName(task.leadId)}
                  </div>
                  
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span className="flex items-center space-x-1">
                      <ApperIcon name="Clock" size={12} />
                      <span className={isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate)) ? 'text-red-600 font-medium' : ''}>
                        {formatDueDate(task.dueDate)}
                      </span>
                    </span>
                  </div>
                </div>

                <Button
                  onClick={(e) => handleMarkComplete(task.Id, e)}
                  size="sm"
                  variant="outline"
                  className="ml-2 flex-shrink-0"
                >
                  <ApperIcon name="Check" size={14} />
                </Button>
              </div>
            </div>
          ))}

          {tasks.length > 0 && (
            <div className="pt-3 border-t">
              <Button
                onClick={() => onTaskClick && onTaskClick(null, 'view-all')}
                variant="outline"
                size="sm"
                className="w-full"
              >
                View All Tasks
                <ApperIcon name="ArrowRight" size={14} />
              </Button>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default PendingTasksWidget;