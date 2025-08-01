import customFieldsData from "@/services/mockData/customFields.json";

let customFields = [...customFieldsData];

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const customFieldService = {
  async getAll() {
    await delay(200);
    return [...customFields];
  },

  async getById(id) {
    await delay(150);
    const field = customFields.find(field => field.Id === parseInt(id));
    if (!field) {
      throw new Error("Custom field not found");
    }
    return { ...field };
  },

  async create(fieldData) {
    await delay(300);
    const maxId = Math.max(...customFields.map(field => field.Id), 0);
    const newField = {
      Id: maxId + 1,
      ...fieldData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    customFields.push(newField);
    return { ...newField };
  },

  async update(id, updateData) {
    await delay(250);
    const index = customFields.findIndex(field => field.Id === parseInt(id));
    if (index === -1) {
      throw new Error("Custom field not found");
    }
    
    customFields[index] = {
      ...customFields[index],
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    
    return { ...customFields[index] };
  },

  async delete(id) {
    await delay(200);
    const index = customFields.findIndex(field => field.Id === parseInt(id));
    if (index === -1) {
      throw new Error("Custom field not found");
    }
    const deletedField = customFields.splice(index, 1)[0];
    return { ...deletedField };
  }
};