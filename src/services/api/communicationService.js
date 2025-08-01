import communicationsData from "@/services/mockData/communications.json";

let communications = [...communicationsData];

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const communicationService = {
  async getAll() {
    await delay(200);
    return [...communications];
  },

  async getById(id) {
    await delay(150);
    const communication = communications.find(comm => comm.Id === parseInt(id));
    if (!communication) {
      throw new Error("Communication not found");
    }
    return { ...communication };
  },

  async getByLeadId(leadId) {
    await delay(200);
    return communications
      .filter(comm => comm.leadId === parseInt(leadId))
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .map(comm => ({ ...comm }));
  },

  async create(communicationData) {
    await delay(300);
    const maxId = Math.max(...communications.map(comm => comm.Id), 0);
    const newCommunication = {
      Id: maxId + 1,
      ...communicationData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    communications.push(newCommunication);
    return { ...newCommunication };
  },

  async update(id, updateData) {
    await delay(250);
    const index = communications.findIndex(comm => comm.Id === parseInt(id));
    if (index === -1) {
      throw new Error("Communication not found");
    }
    communications[index] = {
      ...communications[index],
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    return { ...communications[index] };
  },

  async delete(id) {
    await delay(200);
    const index = communications.findIndex(comm => comm.Id === parseInt(id));
    if (index === -1) {
      throw new Error("Communication not found");
    }
    const deletedCommunication = communications.splice(index, 1)[0];
    return { ...deletedCommunication };
  },

  async getByType(type) {
    await delay(200);
    return communications
      .filter(comm => comm.type === type)
      .map(comm => ({ ...comm }));
  },

  async getByDateRange(startDate, endDate) {
    await delay(200);
    const start = new Date(startDate);
    const end = new Date(endDate);
    return communications
      .filter(comm => {
        const commDate = new Date(comm.date);
        return commDate >= start && commDate <= end;
      })
      .map(comm => ({ ...comm }));
  },

  async getRecentCommunications(limit = 10) {
    await delay(150);
    return communications
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, limit)
      .map(comm => ({ ...comm }));
  },

  async getCommunicationStats(leadId) {
    await delay(200);
    const leadComms = communications.filter(comm => comm.leadId === parseInt(leadId));
    
    const stats = {
      total: leadComms.length,
      calls: leadComms.filter(c => c.type === 'call').length,
      emails: leadComms.filter(c => c.type === 'email').length,
      meetings: leadComms.filter(c => c.type === 'meeting').length,
      lastContact: leadComms.length > 0 ? 
        leadComms.sort((a, b) => new Date(b.date) - new Date(a.date))[0].date : 
        null
    };

    return stats;
  },

  async searchCommunications(searchParams) {
    await delay(250);
    let filtered = [...communications];

    if (searchParams.leadId) {
      filtered = filtered.filter(comm => comm.leadId === parseInt(searchParams.leadId));
    }

    if (searchParams.type) {
      filtered = filtered.filter(comm => comm.type === searchParams.type);
    }

    if (searchParams.outcome) {
      filtered = filtered.filter(comm => comm.outcome === searchParams.outcome);
    }

    if (searchParams.dateFrom) {
      filtered = filtered.filter(comm => new Date(comm.date) >= new Date(searchParams.dateFrom));
    }

    if (searchParams.dateTo) {
      filtered = filtered.filter(comm => new Date(comm.date) <= new Date(searchParams.dateTo));
    }

    if (searchParams.search) {
      const searchTerm = searchParams.search.toLowerCase();
      filtered = filtered.filter(comm =>
        comm.subject?.toLowerCase().includes(searchTerm) ||
        comm.notes?.toLowerCase().includes(searchTerm) ||
        comm.outcome?.toLowerCase().includes(searchTerm)
      );
    }

    return filtered
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .map(comm => ({ ...comm }));
  },

  async markAsFollowUp(id, followUpDate) {
    await delay(200);
    const index = communications.findIndex(comm => comm.Id === parseInt(id));
    if (index === -1) {
      throw new Error("Communication not found");
    }
    
    communications[index] = {
      ...communications[index],
      followUpDate: followUpDate,
      needsFollowUp: true,
      updatedAt: new Date().toISOString()
    };
    
    return { ...communications[index] };
  },

  async getFollowUpCommunications() {
    await delay(200);
    const now = new Date();
    return communications
      .filter(comm => 
        comm.needsFollowUp && 
        comm.followUpDate && 
        new Date(comm.followUpDate) <= now
      )
      .sort((a, b) => new Date(a.followUpDate) - new Date(b.followUpDate))
      .map(comm => ({ ...comm }));
  },

  async bulkDelete(ids) {
    await delay(300);
    const deletedCommunications = [];
    
    for (const id of ids) {
      const index = communications.findIndex(comm => comm.Id === parseInt(id));
      if (index !== -1) {
        deletedCommunications.push(communications.splice(index, 1)[0]);
      }
    }
    
    return deletedCommunications;
  },

  async getDurationStats(leadId) {
    await delay(200);
    const leadComms = communications.filter(comm => 
      comm.leadId === parseInt(leadId) && 
      comm.type === 'call' && 
      comm.duration
    );

    if (leadComms.length === 0) {
      return { totalDuration: 0, averageDuration: 0, callCount: 0 };
    }

    const totalDuration = leadComms.reduce((sum, comm) => sum + (comm.duration || 0), 0);
    const averageDuration = totalDuration / leadComms.length;

    return {
      totalDuration,
      averageDuration: Math.round(averageDuration),
      callCount: leadComms.length
    };
  }
};