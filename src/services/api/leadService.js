import leadsData from "@/services/mockData/leads.json";

let leads = [...leadsData];

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const leadService = {
  async getAll() {
    await delay(300);
    return [...leads];
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

    const noteIndex = leads[leadIndex].notes.findIndex(note => note.id === parseInt(noteId));
    if (noteIndex === -1) {
      throw new Error("Note not found");
    }

    const deletedNote = leads[leadIndex].notes.splice(noteIndex, 1)[0];
    leads[leadIndex].updatedAt = new Date().toISOString();

    return { ...deletedNote };
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