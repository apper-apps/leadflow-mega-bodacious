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
      closeDate: leadData.closeDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      winProbability: leadData.winProbability || 25,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
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
    leads[index] = {
      ...leads[index],
      ...updateData,
      updatedAt: new Date().toISOString()
    };
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
  }
};