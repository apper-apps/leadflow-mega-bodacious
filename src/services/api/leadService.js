import leadsData from "@/services/mockData/leads.json";
import { workflowService } from "@/services/api/workflowService";
let leads = [...leadsData];

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Lead scoring configuration
const scoringConfig = {
  source: {
    'Website': 10,
    'Referral': 15,
    'Social Media': 5,
    'Email Campaign': 8,
    'Trade Show': 12,
    'Cold Call': 3,
    'Partner': 20,
    'Direct': 7
  },
  companySize: {
    'startup': 5,
    'small': 10,
    'medium': 15,
    'large': 20,
    'enterprise': 25
  },
  engagement: {
    low: 5,
    medium: 10,
    high: 20
  }
};

// Calculate lead score based on multiple criteria
const calculateLeadScore = (lead) => {
  let score = 0;
  
  // Source score
  score += scoringConfig.source[lead.source] || 0;
  
  // Company size score (derive from company name or use default)
  const companySize = getCompanySize(lead.company, lead.value);
  score += scoringConfig.companySize[companySize] || 0;
  
  // Engagement score (derive from win probability and recent activity)
  const engagementLevel = getEngagementLevel(lead.winProbability, lead.value);
  score += scoringConfig.engagement[engagementLevel] || 0;
  
  // Bonus for high value deals
  if (lead.value > 50000) score += 10;
  if (lead.value > 100000) score += 15;
  
  return Math.min(score, 100); // Cap at 100
};

// Helper function to determine company size
const getCompanySize = (companyName, dealValue) => {
  if (dealValue > 500000) return 'enterprise';
  if (dealValue > 100000) return 'large';
  if (dealValue > 50000) return 'medium';
  if (dealValue > 10000) return 'small';
  return 'startup';
};

// Helper function to determine engagement level
const getEngagementLevel = (winProbability, dealValue) => {
  const score = (winProbability * 0.7) + (Math.min(dealValue / 100000, 1) * 30);
  if (score > 70) return 'high';
  if (score > 40) return 'medium';
  return 'low';
};

// Add scores to leads when they're retrieved
const addLeadScores = (leadsArray) => {
  return leadsArray.map(lead => ({
    ...lead,
    score: calculateLeadScore(lead)
  }));
};

export const leadService = {
  async getAll() {
    await delay(300);
    return addLeadScores([...leads]);
  },

  async getById(id) {
    await delay(200);
    const lead = leads.find(lead => lead.Id === parseInt(id));
    if (!lead) {
      throw new Error("Lead not found");
    }
    return { ...lead };
  },

async create(leadData) {
    await delay(400);
    const maxId = Math.max(...leads.map(lead => lead.Id), 0);
    const newLead = {
      Id: maxId + 1,
      ...leadData,
      status: "New",
      assignedUser: leadData.assignedUser || null,
      closeDate: leadData.closeDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      winProbability: leadData.winProbability || 25,
      customFields: leadData.customFields || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      assignmentHistory: leadData.assignedUser ? [{
        assignedUser: leadData.assignedUser,
        assignedAt: new Date().toISOString(),
        assignedBy: "System",
        reason: "Initial assignment"
      }] : []
    };
    leads.push(newLead);
    
    // Apply workflow automation rules
    try {
      const updatedLead = await workflowService.processLeadRules(newLead, 'created');
      if (updatedLead.Id !== newLead.Id) {
        const index = leads.findIndex(lead => lead.Id === newLead.Id);
        if (index !== -1) {
          leads[index] = updatedLead;
          return { ...updatedLead };
        }
      }
    } catch (error) {
      console.warn('Workflow automation failed:', error);
    }
    
    return { ...newLead };
  },

async update(id, updateData) {
    await delay(350);
    const index = leads.findIndex(lead => lead.Id === parseInt(id));
    if (index === -1) {
      throw new Error("Lead not found");
    }
    
    // Track assignment changes
    const existingLead = leads[index];
    const updatedLead = {
      ...existingLead,
      ...updateData,
      customFields: {
        ...existingLead.customFields,
        ...updateData.customFields
      },
      updatedAt: new Date().toISOString()
    };
    
    // If assignedUser is being changed, add to assignment history
    if (updateData.assignedUser && updateData.assignedUser !== existingLead.assignedUser) {
      if (!updatedLead.assignmentHistory) {
        updatedLead.assignmentHistory = [];
      }
      updatedLead.assignmentHistory.push({
        assignedUser: updateData.assignedUser,
        assignedAt: new Date().toISOString(),
        assignedBy: updateData.assignedBy || "User",
        reason: updateData.assignmentReason || "Manual reassignment"
      });
    }
    
    leads[index] = updatedLead;
    
    // Apply workflow automation rules for updates (exclude workflow-generated updates)
    if (!updateData._skipWorkflow) {
      try {
        const automatedLead = await workflowService.processLeadRules(updatedLead, 'updated');
        if (automatedLead.Id === updatedLead.Id) {
          leads[index] = automatedLead;
          return { ...automatedLead };
        }
      } catch (error) {
        console.warn('Workflow automation failed:', error);
      }
    }
    
    return { ...leads[index] };
  },

  async delete(id) {
    await delay(250);
    const index = leads.findIndex(lead => lead.Id === parseInt(id));
    if (index === -1) {
      throw new Error("Lead not found");
    }
    const deletedLead = leads.splice(index, 1)[0];
    return { ...deletedLead };
  },

async getByStatus(status) {
    await delay(250);
    return leads.filter(lead => lead.status === status).map(lead => ({ ...lead }));
  },

  async updateStatus(id, status) {
    await delay(200);
    const index = leads.findIndex(lead => lead.Id === parseInt(id));
    if (index === -1) {
      throw new Error("Lead not found");
    }
    
    // Add to status history
    const statusChange = {
      status,
      changedAt: new Date().toISOString(),
      changedBy: "Sales Rep"
    };
    
    if (!leads[index].statusHistory) {
      leads[index].statusHistory = [];
    }
    leads[index].statusHistory.push(statusChange);
    
    leads[index] = {
      ...leads[index],
      status,
      updatedAt: new Date().toISOString()
    };
    
    return { ...leads[index] };
  },

  async addNote(id, noteContent) {
    await delay(200);
    const index = leads.findIndex(lead => lead.Id === parseInt(id));
    if (index === -1) {
      throw new Error("Lead not found");
    }

    if (!leads[index].notes) {
      leads[index].notes = [];
    }

    const maxNoteId = Math.max(...leads[index].notes.map(note => note.id), 0);
    const newNote = {
      id: maxNoteId + 1,
      content: noteContent,
      createdAt: new Date().toISOString(),
      createdBy: "Sales Rep"
    };

    leads[index].notes.push(newNote);
    leads[index].updatedAt = new Date().toISOString();

    return { ...newNote };
  },

async updateNote(leadId, noteId, noteContent) {
    await delay(200);
    const leadIndex = leads.findIndex(lead => lead.Id === parseInt(leadId));
    if (leadIndex === -1) {
      throw new Error("Lead not found");
    }

    if (!leads[leadIndex].notes) {
      leads[leadIndex].notes = [];
    }

    const noteIndex = leads[leadIndex].notes.findIndex(note => note.id === parseInt(noteId));
    if (noteIndex === -1) {
      throw new Error("Note not found");
    }

    leads[leadIndex].notes[noteIndex] = {
      ...leads[leadIndex].notes[noteIndex],
      content: noteContent,
      updatedAt: new Date().toISOString()
    };
    leads[leadIndex].updatedAt = new Date().toISOString();

    return { ...leads[leadIndex].notes[noteIndex] };
  },

  async deleteNote(leadId, noteId) {
    await delay(200);
    const leadIndex = leads.findIndex(lead => lead.Id === parseInt(leadId));
    if (leadIndex === -1) {
      throw new Error("Lead not found");
    }

    if (!leads[leadIndex].notes) {
      return;
    }

    leads[leadIndex].notes = leads[leadIndex].notes.filter(note => note.id !== parseInt(noteId));
    leads[leadIndex].updatedAt = new Date().toISOString();
  },

  // Bulk operations
  async bulkUpdateStatus(leadIds, status) {
    await delay(300);
    const updatedLeads = [];
    
    for (const id of leadIds) {
      const index = leads.findIndex(lead => lead.Id === parseInt(id));
      if (index !== -1) {
        const statusChange = {
          status,
          changedAt: new Date().toISOString(),
          changedBy: "Sales Rep"
        };
        
        if (!leads[index].statusHistory) {
          leads[index].statusHistory = [];
        }
        leads[index].statusHistory.push(statusChange);
        
        leads[index] = {
          ...leads[index],
          status,
          updatedAt: new Date().toISOString()
        };
        
        updatedLeads.push({ ...leads[index] });
      }
    }
    
    return updatedLeads;
  },

  async bulkAssignUser(leadIds, assignedUser) {
    await delay(300);
    const updatedLeads = [];
    
    for (const id of leadIds) {
      const index = leads.findIndex(lead => lead.Id === parseInt(id));
      if (index !== -1) {
        leads[index] = {
          ...leads[index],
          assignedUser,
          updatedAt: new Date().toISOString()
        };
        
        updatedLeads.push({ ...leads[index] });
      }
    }
    
    return updatedLeads;
  },

  async bulkUpdateSource(leadIds, source) {
    await delay(300);
    const updatedLeads = [];
    
    for (const id of leadIds) {
      const index = leads.findIndex(lead => lead.Id === parseInt(id));
      if (index !== -1) {
        leads[index] = {
          ...leads[index],
          source,
          updatedAt: new Date().toISOString()
        };
        
        updatedLeads.push({ ...leads[index] });
      }
    }
    
    return updatedLeads;
  },

  async bulkDelete(leadIds) {
    await delay(300);
    const deletedIds = [];
    
    for (const id of leadIds) {
      const index = leads.findIndex(lead => lead.Id === parseInt(id));
      if (index !== -1) {
        leads.splice(index, 1);
        deletedIds.push(parseInt(id));
      }
    }
    
    return deletedIds;
  },
async bulkUpdateStage(leadIds, stage) {
    await delay(300);
    const updatedLeads = [];
    
    for (const id of leadIds) {
      const index = leads.findIndex(lead => lead.Id === parseInt(id));
      if (index !== -1) {
        leads[index] = {
          ...leads[index],
          stage,
          updatedAt: new Date().toISOString()
        };
        
        updatedLeads.push({ ...leads[index] });
      }
    }
    
    return updatedLeads;
  },

async findDuplicates(leadsData) {
    const duplicates = [];
    
    leadsData.forEach((newLead, index) => {
      if (!newLead.email) return;
      
      const existingLead = leads.find(lead => 
        lead.email.toLowerCase() === newLead.email.toLowerCase()
      );
      
      if (existingLead) {
        duplicates.push({
          id: `duplicate_${index}`,
          newLead,
          existingLead,
          rowIndex: index
        });
      }
    });
    
    return duplicates;
  },

  async bulkImport(leadsData, duplicateResolution = {}, onProgress = () => {}) {
    const batchSize = 10;
    const results = { successful: 0, failed: 0, merged: 0, skipped: 0, errors: [] };
    
    for (let i = 0; i < leadsData.length; i += batchSize) {
      const batch = leadsData.slice(i, i + batchSize);
      
      for (const leadData of batch) {
        try {
          // Validate required fields
          if (!leadData.name || !leadData.email) {
            results.failed++;
            results.errors.push(`Lead missing required fields: ${JSON.stringify(leadData)}`);
            continue;
          }

          // Check for duplicate email
          const existingLead = leads.find(lead => 
            lead.email.toLowerCase() === leadData.email.toLowerCase()
          );
          
          if (existingLead) {
            // Find duplicate resolution
            const duplicateKey = Object.keys(duplicateResolution).find(key => {
              const resolution = duplicateResolution[key];
              return resolution && key.includes('duplicate_');
            });
            
            const resolution = duplicateKey ? duplicateResolution[duplicateKey] : 'skip';
            
            if (resolution === 'skip') {
              results.skipped++;
              continue;
            } else if (resolution === 'merge') {
              // Merge data - update existing lead with new data where available
              const updatedLead = {
                ...existingLead,
                name: leadData.name || existingLead.name,
                phone: leadData.phone || existingLead.phone,
                company: leadData.company || existingLead.company,
                title: leadData.title || existingLead.title,
                address: leadData.address || existingLead.address,
                value: leadData.value || existingLead.value,
                source: leadData.source || existingLead.source,
                updatedAt: new Date().toISOString()
              };

              // Add merge note
              updatedLead.notes = [...(existingLead.notes || []), {
                id: Date.now(),
                content: `Lead data merged from CSV import. Updated fields: ${Object.keys(leadData).filter(key => leadData[key] && leadData[key] !== existingLead[key]).join(', ')}`,
                createdAt: new Date().toISOString(),
                createdBy: 'CSV Import Merge'
              }];

              // Update the existing lead
              const leadIndex = leads.findIndex(l => l.Id === existingLead.Id);
              if (leadIndex !== -1) {
                leads[leadIndex] = updatedLead;
                results.merged++;
              }
              continue;
            }
          }

          // Create new lead
          const newId = Math.max(...leads.map(l => l.Id)) + 1;
          const newLead = {
            Id: newId,
            name: leadData.name,
            email: leadData.email,
            phone: leadData.phone || '',
            company: leadData.company || '',
            title: leadData.title || '',
            address: leadData.address || '',
            status: leadData.status || 'New',
            source: leadData.source || 'Import',
            value: leadData.value || 0,
            closeDate: leadData.closeDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            winProbability: leadData.winProbability || 25,
            assignedUser: leadData.assignedUser || 'System',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            notes: [{
              id: 1,
              content: 'Lead created via CSV import',
              createdAt: new Date().toISOString(),
              createdBy: 'CSV Import'
            }],
            statusHistory: [
              {
                status: leadData.status || 'New',
                changedAt: new Date().toISOString(),
                changedBy: 'CSV Import'
              }
            ],
            assignmentHistory: [
              {
                assignedUser: leadData.assignedUser || 'System',
                assignedAt: new Date().toISOString(),
                assignedBy: 'CSV Import',
                reason: 'Bulk import'
              }
            ]
          };

          leads.push(newLead);
          results.successful++;
        } catch (error) {
          results.failed++;
          results.errors.push(`Error importing lead: ${error.message}`);
        }
      }
      
      // Update progress
      const progress = Math.round(((i + batch.length) / leadsData.length) * 100);
      onProgress(progress);
      
      // Simulate processing delay
      await delay(100);
    }
    
    return results;
  },
async getStatusHistory(id) {
    await delay(200);
    const lead = leads.find(lead => lead.Id === parseInt(id));
    if (!lead) {
      throw new Error("Lead not found");
    }
    return lead.statusHistory || [];
  },

  async assignLead(id, assignedUser, assignedBy = "User", reason = "Manual assignment") {
    await delay(300);
    const index = leads.findIndex(lead => lead.Id === parseInt(id));
    if (index === -1) {
      throw new Error("Lead not found");
    }

    const existingLead = leads[index];
    
    // Don't update if assigning to same user
    if (existingLead.assignedUser === assignedUser) {
      return { ...existingLead };
    }

    // Update lead assignment
    leads[index] = {
      ...existingLead,
      assignedUser,
      updatedAt: new Date().toISOString(),
      assignmentHistory: [
        ...(existingLead.assignmentHistory || []),
        {
          assignedUser,
          assignedAt: new Date().toISOString(),
          assignedBy,
          reason
        }
      ]
    };
    
    return { ...leads[index] };
  },

  async getAssignmentHistory(id) {
    await delay(200);
    const lead = leads.find(lead => lead.Id === parseInt(id));
    if (!lead) {
      throw new Error("Lead not found");
    }
    return lead.assignmentHistory || [];
  },

  async getUniqueUsers() {
    await delay(100);
    const users = new Set();
    leads.forEach(lead => {
      if (lead.assignedUser) users.add(lead.assignedUser);
    });
    return Array.from(users).sort();
},

  async getFilteredLeads(filterParams) {
    await delay(200);
    let filtered = [...leads];

    if (filterParams.status) {
      filtered = filtered.filter(lead => lead.status === filterParams.status);
    }

    if (filterParams.source) {
      filtered = filtered.filter(lead => lead.source === filterParams.source);
    }

    if (filterParams.assignedUser) {
      filtered = filtered.filter(lead => lead.assignedUser === filterParams.assignedUser);
    }

    if (filterParams.dateFrom) {
      filtered = filtered.filter(lead => new Date(lead.createdAt) >= new Date(filterParams.dateFrom));
    }

    if (filterParams.dateTo) {
      filtered = filtered.filter(lead => new Date(lead.createdAt) <= new Date(filterParams.dateTo));
    }

    if (filterParams.valueMin) {
      filtered = filtered.filter(lead => lead.value >= Number(filterParams.valueMin));
    }

    if (filterParams.valueMax) {
      filtered = filtered.filter(lead => lead.value <= Number(filterParams.valueMax));
    }

    if (filterParams.search) {
      const searchTerm = filterParams.search.toLowerCase();
      filtered = filtered.filter(lead =>
        lead.name.toLowerCase().includes(searchTerm) ||
        lead.email.toLowerCase().includes(searchTerm) ||
        lead.company.toLowerCase().includes(searchTerm) ||
        (lead.assignedUser && lead.assignedUser.toLowerCase().includes(searchTerm))
      );
    }

    return filtered.map(lead => ({ ...lead }));
  },

  async getAnalytics(dateRange) {
    await delay(300);
    const filteredLeads = leads.filter(lead => {
      const leadDate = new Date(lead.createdAt);
      const startDate = new Date(dateRange.startDate);
      const endDate = new Date(dateRange.endDate);
      return leadDate >= startDate && leadDate <= endDate;
    });

    return {
      leadSources: this.calculateLeadSourcePerformance(filteredLeads),
      conversionFunnel: this.calculateConversionFunnel(filteredLeads),
      pipelineVelocity: this.calculatePipelineVelocity(filteredLeads),
      winLossRatio: this.calculateWinLossRatio(filteredLeads),
      monthlyTrends: this.calculateMonthlyTrends(filteredLeads),
      sourceROI: this.calculateSourceROI(filteredLeads),
      teamPerformance: this.calculateTeamPerformance(filteredLeads),
      forecast: this.calculateForecast(filteredLeads)
    };
  },

  calculateLeadSourcePerformance(leadsArray) {
    const sourceStats = {};
    leadsArray.forEach(lead => {
      if (!sourceStats[lead.source]) {
        sourceStats[lead.source] = { count: 0, value: 0, won: 0 };
      }
      sourceStats[lead.source].count++;
      sourceStats[lead.source].value += lead.value;
      if (lead.status === 'Won') sourceStats[lead.source].won++;
    });

    return Object.entries(sourceStats).map(([source, stats]) => ({
      source,
      leads: stats.count,
      value: stats.value,
      wonDeals: stats.won,
      conversionRate: stats.count > 0 ? (stats.won / stats.count) * 100 : 0
    }));
  },

  calculateConversionFunnel(leadsArray) {
    const stages = ['New', 'Contacted', 'Qualified', 'Proposal', 'Won'];
    return stages.map(stage => ({
      stage,
      count: leadsArray.filter(lead => {
        if (stage === 'Won') return lead.status === 'Won';
        const statusOrder = ['New', 'Contacted', 'Qualified', 'Proposal', 'Won'];
        const currentIndex = statusOrder.indexOf(lead.status);
        const stageIndex = statusOrder.indexOf(stage);
        return currentIndex >= stageIndex;
      }).length
    }));
  },

  calculatePipelineVelocity(leadsArray) {
    const velocityData = [];
    const today = new Date();
    
    for (let i = 0; i < 12; i++) {
      const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthLeads = leadsArray.filter(lead => {
        const leadDate = new Date(lead.createdAt);
        return leadDate.getMonth() === monthDate.getMonth() && 
               leadDate.getFullYear() === monthDate.getFullYear();
      });

      const avgDaysToClose = monthLeads
        .filter(lead => lead.status === 'Won')
        .reduce((acc, lead) => {
          const created = new Date(lead.createdAt);
          const closed = new Date(lead.closeDate);
          return acc + Math.max(1, Math.ceil((closed - created) / (1000 * 60 * 60 * 24)));
        }, 0) / Math.max(1, monthLeads.filter(lead => lead.status === 'Won').length);

      velocityData.unshift({
        month: monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        avgDays: Math.round(avgDaysToClose) || 0,
        leadsCreated: monthLeads.length,
        leadsWon: monthLeads.filter(lead => lead.status === 'Won').length
      });
    }
    
    return velocityData;
  },

  calculateWinLossRatio(leadsArray) {
    const closedLeads = leadsArray.filter(lead => ['Won', 'Lost'].includes(lead.status));
    const wonLeads = closedLeads.filter(lead => lead.status === 'Won');
    const lostLeads = closedLeads.filter(lead => lead.status === 'Lost');

    return {
      won: wonLeads.length,
      lost: lostLeads.length,
      ratio: lostLeads.length > 0 ? wonLeads.length / lostLeads.length : wonLeads.length,
      wonValue: wonLeads.reduce((sum, lead) => sum + lead.value, 0),
      lostValue: lostLeads.reduce((sum, lead) => sum + lead.value, 0)
    };
  },

  calculateMonthlyTrends(leadsArray) {
    const trends = [];
    const today = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthLeads = leadsArray.filter(lead => {
        const leadDate = new Date(lead.createdAt);
        return leadDate.getMonth() === monthDate.getMonth() && 
               leadDate.getFullYear() === monthDate.getFullYear();
      });

      trends.push({
        month: monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        newLeads: monthLeads.length,
        wonDeals: monthLeads.filter(lead => lead.status === 'Won').length,
        revenue: monthLeads.filter(lead => lead.status === 'Won')
                          .reduce((sum, lead) => sum + lead.value, 0),
        pipelineValue: monthLeads.filter(lead => !['Won', 'Lost'].includes(lead.status))
                                .reduce((sum, lead) => sum + lead.value, 0)
      });
    }
    
    return trends;
  },

  calculateSourceROI(leadsArray) {
    const sourceCosts = {
      'Website': 2000,
      'LinkedIn': 1500,
      'Referral': 500,
      'Cold Call': 1000,
      'Trade Show': 5000,
      'Email Campaign': 800,
      'Social Media': 1200,
      'Partner': 1000
    };

    const sourceStats = {};
    leadsArray.forEach(lead => {
      if (!sourceStats[lead.source]) {
        sourceStats[lead.source] = { revenue: 0, cost: sourceCosts[lead.source] || 1000 };
      }
      if (lead.status === 'Won') {
        sourceStats[lead.source].revenue += lead.value;
      }
    });

    return Object.entries(sourceStats).map(([source, stats]) => ({
      source,
      revenue: stats.revenue,
      cost: stats.cost,
      roi: stats.cost > 0 ? ((stats.revenue - stats.cost) / stats.cost) * 100 : 0
    }));
  },

  calculateTeamPerformance(leadsArray) {
    const teamStats = {};
    leadsArray.forEach(lead => {
      if (!teamStats[lead.assignedUser]) {
        teamStats[lead.assignedUser] = { leads: 0, won: 0, revenue: 0, pipeline: 0 };
      }
      teamStats[lead.assignedUser].leads++;
      if (lead.status === 'Won') {
        teamStats[lead.assignedUser].won++;
        teamStats[lead.assignedUser].revenue += lead.value;
      } else if (!['Lost'].includes(lead.status)) {
        teamStats[lead.assignedUser].pipeline += lead.value;
      }
    });

    return Object.entries(teamStats).map(([member, stats]) => ({
      member,
      totalLeads: stats.leads,
      wonDeals: stats.won,
      revenue: stats.revenue,
      pipelineValue: stats.pipeline,
      conversionRate: stats.leads > 0 ? (stats.won / stats.leads) * 100 : 0
    }));
  },

  calculateForecast(leadsArray) {
    const forecast = [];
    const today = new Date();
    
    for (let i = 0; i < 6; i++) {
      const monthDate = new Date(today.getFullYear(), today.getMonth() + i, 1);
      const activeLeads = leadsArray.filter(lead => 
        !['Won', 'Lost'].includes(lead.status) &&
        new Date(lead.closeDate) >= monthDate &&
        new Date(lead.closeDate) < new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1)
      );

      const forecastRevenue = activeLeads.reduce((sum, lead) => 
        sum + (lead.value * (lead.winProbability / 100)), 0);
      
      const bestCase = activeLeads.reduce((sum, lead) => sum + lead.value, 0);
      const worstCase = forecastRevenue * 0.5;

      forecast.push({
        month: monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        forecast: Math.round(forecastRevenue),
        bestCase: Math.round(bestCase),
        worstCase: Math.round(worstCase),
        leadsCount: activeLeads.length
      });
    }
    
    return forecast;
  },

  async getCommunications(id) {
    await delay(200);
    const lead = leads.find(lead => lead.Id === parseInt(id));
    if (!lead) {
      throw new Error("Lead not found");
    }
    return lead.communications || [];
  },

  async addCommunication(id, communicationData) {
    await delay(250);
    const index = leads.findIndex(lead => lead.Id === parseInt(id));
    if (index === -1) {
      throw new Error("Lead not found");
    }

    if (!leads[index].communications) {
      leads[index].communications = [];
    }

    const maxCommId = Math.max(...leads[index].communications.map(comm => comm.id), 0);
    const newCommunication = {
      id: maxCommId + 1,
      ...communicationData,
      createdAt: new Date().toISOString(),
      createdBy: "Sales Rep"
    };

    leads[index].communications.push(newCommunication);
    leads[index].updatedAt = new Date().toISOString();

    return { ...newCommunication };
  },

  async updateCommunication(leadId, commId, communicationData) {
    await delay(250);
    const leadIndex = leads.findIndex(lead => lead.Id === parseInt(leadId));
    if (leadIndex === -1) {
      throw new Error("Lead not found");
    }

    if (!leads[leadIndex].communications) {
      leads[leadIndex].communications = [];
    }

    const commIndex = leads[leadIndex].communications.findIndex(comm => comm.id === parseInt(commId));
    if (commIndex === -1) {
      throw new Error("Communication not found");
    }

    leads[leadIndex].communications[commIndex] = {
      ...leads[leadIndex].communications[commIndex],
      ...communicationData,
      updatedAt: new Date().toISOString()
    };

    leads[leadIndex].updatedAt = new Date().toISOString();

    return { ...leads[leadIndex].communications[commIndex] };
  },

  async deleteCommunication(leadId, commId) {
    await delay(200);
    const leadIndex = leads.findIndex(lead => lead.Id === parseInt(leadId));
    if (leadIndex === -1) {
      throw new Error("Lead not found");
    }

    if (!leads[leadIndex].communications) {
      return;
    }

    const commIndex = leads[leadIndex].communications.findIndex(comm => comm.id === parseInt(commId));
    if (commIndex === -1) {
      throw new Error("Communication not found");
    }

    const deletedCommunication = leads[leadIndex].communications.splice(commIndex, 1)[0];
    leads[leadIndex].updatedAt = new Date().toISOString();

    return { ...deletedCommunication };
  }
};