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
    return this.update(id, { status });
  }
};