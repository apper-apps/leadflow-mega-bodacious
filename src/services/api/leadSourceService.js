import leadSourcesData from "@/services/mockData/leadSources.json";

let sources = [...leadSourcesData];

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const leadSourceService = {
  async getAll() {
    await delay(150);
    return [...sources];
  },

  async getById(id) {
    await delay(100);
    const source = sources.find(source => source.Id === parseInt(id));
    if (!source) {
      throw new Error("Lead source not found");
    }
    return { ...source };
  },

  async create(sourceData) {
    await delay(200);
    const maxId = Math.max(...sources.map(source => source.Id), 0);
    const newSource = {
      Id: maxId + 1,
      ...sourceData
    };
    sources.push(newSource);
    return { ...newSource };
  },

  async update(id, updateData) {
    await delay(200);
    const index = sources.findIndex(source => source.Id === parseInt(id));
    if (index === -1) {
      throw new Error("Lead source not found");
    }
    sources[index] = {
      ...sources[index],
      ...updateData
    };
    return { ...sources[index] };
  },

  async delete(id) {
    await delay(150);
    const index = sources.findIndex(source => source.Id === parseInt(id));
    if (index === -1) {
      throw new Error("Lead source not found");
    }
    const deletedSource = sources.splice(index, 1)[0];
    return { ...deletedSource };
  }
};