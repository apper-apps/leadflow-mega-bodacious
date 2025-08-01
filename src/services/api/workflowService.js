import workflowData from "@/services/mockData/workflowAutomation.json";
import { taskService } from "@/services/api/taskService";
import { leadService } from "@/services/api/leadService";
import { teamMemberService } from "@/services/api/teamMemberService";

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

let rules = [...workflowData.rules];
let activity = [...workflowData.activity];
let templates = [...workflowData.templates];
const workflowService = {
  // Rule Management
  async getAllRules() {
    await delay(200);
    return rules.map(rule => ({ ...rule }));
  },

  async getRuleById(id) {
    await delay(150);
    const rule = rules.find(r => r.Id === parseInt(id));
    if (!rule) {
      throw new Error("Rule not found");
    }
    return { ...rule };
  },

  async createRule(ruleData) {
    await delay(300);
    const maxId = Math.max(...rules.map(rule => rule.Id), 0);
    const newRule = {
      Id: maxId + 1,
      ...ruleData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: "User"
    };
    rules.push(newRule);
    return { ...newRule };
  },

async updateRule(id, updateData) {
    await delay(300);
    const ruleIndex = rules.findIndex(r => r.Id === parseInt(id));
    if (ruleIndex === -1) {
      throw new Error("Rule not found");
    }
    
    rules[ruleIndex] = {
      ...rules[ruleIndex],
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    
    return { ...rules[ruleIndex] };
  },

  async deleteRule(id) {
    await delay(200);
    const ruleIndex = rules.findIndex(r => r.Id === parseInt(id));
    if (ruleIndex === -1) {
      throw new Error("Rule not found");
    }
    
    rules.splice(ruleIndex, 1);
    return true;
  },

  async toggleRuleStatus(id, isActive) {
    return this.updateRule(id, { isActive });
  },

  // Template Management
  async getAllTemplates() {
    await delay(150);
    return templates.map(template => ({ ...template }));
  },

  async getTemplateById(id) {
    await delay(100);
    const template = templates.find(t => t.Id === parseInt(id));
    if (!template) {
      throw new Error("Template not found");
    }
    return { ...template };
  },

  // Activity Log
  async getActivity(limit = 50) {
    await delay(200);
    return activity
      .sort((a, b) => new Date(b.triggeredAt) - new Date(a.triggeredAt))
      .slice(0, limit)
      .map(act => ({ ...act }));
  },

  async getActivityByRule(ruleId) {
    await delay(150);
    return activity
      .filter(act => act.ruleId === parseInt(ruleId))
      .sort((a, b) => new Date(b.triggeredAt) - new Date(a.triggeredAt))
      .map(act => ({ ...act }));
  },

  // Rule Processing Engine
  async processLeadRules(lead, triggerType) {
    const activeRules = rules
      .filter(rule => rule.isActive && rule.trigger.type === `lead_${triggerType}`)
      .sort((a, b) => (a.priority || 999) - (b.priority || 999));

    let processedLead = { ...lead };
    
    for (const rule of activeRules) {
      try {
        const matches = await this.evaluateRuleConditions(processedLead, rule.trigger.conditions);
        
        if (matches) {
          const updatedLead = await this.executeRuleActions(processedLead, rule.actions);
          
          // Log activity for each action
          for (const action of rule.actions) {
            await this.logActivity({
              ruleId: rule.Id,
              ruleName: rule.name,
              leadId: lead.Id,
              leadName: lead.name,
              action: action.type,
              actionValue: action.value,
              status: 'success'
            });
          }
          
          processedLead = updatedLead;
        }
      } catch (error) {
        console.error(`Rule ${rule.Id} execution failed:`, error);
        await this.logActivity({
          ruleId: rule.Id,
          ruleName: rule.name,
          leadId: lead.Id,
          leadName: lead.name,
          action: 'rule_execution',
          actionValue: error.message,
          status: 'error'
        });
      }
    }

    return processedLead;
  },

  async evaluateRuleConditions(lead, conditions) {
    for (const condition of conditions) {
      const fieldValue = this.getLeadFieldValue(lead, condition.field);
      const conditionValue = condition.value;
      
      switch (condition.operator) {
        case 'equals':
          if (fieldValue !== conditionValue) return false;
          break;
        case 'not_equals':
          if (fieldValue === conditionValue) return false;
          break;
        case 'contains':
          if (!fieldValue || !fieldValue.toString().toLowerCase().includes(conditionValue.toLowerCase())) return false;
          break;
        case 'not_contains':
          if (fieldValue && fieldValue.toString().toLowerCase().includes(conditionValue.toLowerCase())) return false;
          break;
        case 'greater_than':
          if (parseFloat(fieldValue) <= parseFloat(conditionValue)) return false;
          break;
        case 'less_than':
          if (parseFloat(fieldValue) >= parseFloat(conditionValue)) return false;
          break;
        case 'greater_than_equal':
          if (parseFloat(fieldValue) < parseFloat(conditionValue)) return false;
          break;
        case 'less_than_equal':
          if (parseFloat(fieldValue) > parseFloat(conditionValue)) return false;
          break;
        case 'is_empty':
          if (fieldValue && fieldValue.toString().trim() !== '') return false;
          break;
        case 'is_not_empty':
          if (!fieldValue || fieldValue.toString().trim() === '') return false;
          break;
        default:
          console.warn(`Unknown operator: ${condition.operator}`);
          return false;
      }
    }
    return true;
  },

async executeRuleActions(lead, actions) {
    let updatedLead = { ...lead };
    
    for (const action of actions) {
      switch (action.type) {
        case 'assign_user':
          updatedLead.assignedUser = action.value;
          if (!updatedLead.assignmentHistory) {
            updatedLead.assignmentHistory = [];
          }
          updatedLead.assignmentHistory.push({
            assignedUser: action.value,
            assignedAt: new Date().toISOString(),
            assignedBy: "Workflow Automation",
            reason: "Automated assignment"
          });
          break;
          
        case 'set_status':
          updatedLead.status = action.value;
          if (!updatedLead.statusHistory) {
            updatedLead.statusHistory = [];
          }
          updatedLead.statusHistory.push({
            status: action.value,
            changedAt: new Date().toISOString(),
            changedBy: "Workflow Automation"
          });
          break;
          
        case 'add_tag':
          if (!updatedLead.tags) {
            updatedLead.tags = [];
          }
          if (!updatedLead.tags.includes(action.value)) {
            updatedLead.tags.push(action.value);
          }
          break;
          
        case 'set_priority':
          updatedLead.priority = action.value;
          break;
          
        case 'add_note':
          if (!updatedLead.notes) {
            updatedLead.notes = [];
          }
          updatedLead.notes.push({
            id: Date.now(),
            content: action.value,
            createdAt: new Date().toISOString(),
            createdBy: "Workflow Automation"
          });
          break;
          
        case 'create_task':
          try {
            await taskService.create({
              title: action.value,
              description: `Automated task created for lead: ${lead.name}`,
              assignedUser: lead.assignedUser || 'Unassigned',
              dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
              priority: 'Medium',
              status: 'Open',
              leadId: lead.Id,
              createdBy: 'Workflow Automation'
            });
          } catch (error) {
            console.error('Failed to create automated task:', error);
          }
          break;
          
        case 'send_notification':
          // In a real implementation, this would send actual notifications
          console.log(`Notification sent: ${action.value} for lead ${lead.name}`);
          if (!updatedLead.notifications) {
            updatedLead.notifications = [];
          }
          updatedLead.notifications.push({
            id: Date.now(),
            message: action.value,
            sentAt: new Date().toISOString(),
            sentBy: "Workflow Automation",
            type: "automation"
          });
          break;
          
        case 'update_field':
          if (action.field && action.value) {
            if (!updatedLead.customFields) {
              updatedLead.customFields = {};
            }
            updatedLead.customFields[action.field] = action.value;
          }
          break;
          
        default:
          console.warn(`Unknown action type: ${action.type}`);
      }
    }
    
    updatedLead.updatedAt = new Date().toISOString();
    
    // Update the lead in the database (mark to skip workflow to prevent loops)
    try {
      await leadService.update(lead.Id, { ...updatedLead, _skipWorkflow: true });
    } catch (error) {
      console.error('Failed to update lead from workflow:', error);
    }
    
    return updatedLead;
  },

getLeadFieldValue(lead, fieldName) {
    switch (fieldName) {
      case 'source':
        return lead.source;
      case 'status':
        return lead.status;
      case 'value':
        return lead.value;
      case 'assignedUser':
        return lead.assignedUser;
      case 'company':
        return lead.company;
      case 'email':
        return lead.email;
      case 'phone':
        return lead.phone;
      case 'address':
        return lead.address;
      case 'name':
        return lead.name;
      case 'title':
        return lead.title;
      case 'priority':
        return lead.priority;
      case 'tags':
        return lead.tags;
      case 'score':
        return lead.score;
      case 'createdAt':
        return lead.createdAt;
      case 'updatedAt':
        return lead.updatedAt;
      default:
        // Check custom fields
        return lead.customFields?.[fieldName];
    }
  },

  async logActivity(activityData) {
    const maxId = Math.max(...activity.map(act => act.Id), 0);
    const newActivity = {
      Id: maxId + 1,
      ...activityData,
      triggeredAt: new Date().toISOString()
    };
    activity.unshift(newActivity);
    
    // Keep only last 1000 activities
    if (activity.length > 1000) {
      activity = activity.slice(0, 1000);
    }
  },

  // Validation and Testing
async validateRule(ruleData) {
    const errors = [];
    
    if (!ruleData.name || ruleData.name.trim() === '') {
      errors.push('Rule name is required');
    }
    
    if (!ruleData.trigger || !ruleData.trigger.conditions || ruleData.trigger.conditions.length === 0) {
      errors.push('At least one trigger condition is required');
    }
    
    if (!ruleData.actions || ruleData.actions.length === 0) {
      errors.push('At least one action is required');
    }
    
    // Validate conditions
    if (ruleData.trigger?.conditions) {
      for (const condition of ruleData.trigger.conditions) {
        if (!condition.field || !condition.operator) {
          errors.push('All conditions must have field and operator');
        }
        
        if (condition.operator !== 'is_empty' && condition.operator !== 'is_not_empty' && !condition.value) {
          errors.push('Condition value is required for this operator');
        }
      }
    }
    
    // Validate actions
    if (ruleData.actions) {
      for (const action of ruleData.actions) {
        if (!action.type) {
          errors.push('Action type is required');
        }
        
        if (action.type === 'assign_user' && !action.value) {
          errors.push('User assignment requires a user value');
        }
        
        if (action.type === 'set_status' && !action.value) {
          errors.push('Status action requires a status value');
        }
        
        if (action.type === 'create_task' && !action.value) {
          errors.push('Task creation requires a task title');
        }
        
        if (action.type === 'send_notification' && !action.value) {
          errors.push('Notification requires a message');
        }
        
        if (action.type === 'update_field' && (!action.field || !action.value)) {
          errors.push('Field update requires both field name and value');
        }
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },

  async testRule(ruleData, testLead) {
    try {
      const matches = await this.evaluateRuleConditions(testLead, ruleData.trigger.conditions);
      if (matches) {
        const resultLead = await this.executeRuleActions(testLead, ruleData.actions);
        return {
          matches: true,
          result: resultLead,
          message: 'Rule would be triggered and actions executed'
        };
      } else {
        return {
          matches: false,
          result: testLead,
          message: 'Rule conditions do not match this lead'
        };
      }
    } catch (error) {
      return {
        matches: false,
        result: testLead,
        message: `Rule test failed: ${error.message}`,
        error: true
      };
    }
  },

  // Analytics
  async getRuleStats() {
    await delay(200);
    const stats = {
      totalRules: rules.length,
      activeRules: rules.filter(r => r.isActive).length,
      inactiveRules: rules.filter(r => !r.isActive).length,
      totalActivity: activity.length,
      successfulRuns: activity.filter(a => a.status === 'success').length,
      failedRuns: activity.filter(a => a.status === 'error').length
    };
    
    // Rule performance
    const rulePerformance = rules.map(rule => {
      const ruleActivity = activity.filter(a => a.ruleId === rule.Id);
      return {
        ruleId: rule.Id,
        ruleName: rule.name,
        totalRuns: ruleActivity.length,
        successfulRuns: ruleActivity.filter(a => a.status === 'success').length,
        failedRuns: ruleActivity.filter(a => a.status === 'error').length,
        lastRun: ruleActivity.length > 0 ? ruleActivity[0].triggeredAt : null
      };
    });
    
    return {
      ...stats,
      rulePerformance
    };
  }
};

export { workflowService };