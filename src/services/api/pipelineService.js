import pipelineStagesData from "@/services/mockData/pipelineStages.json";

let stages = [...pipelineStagesData];

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const pipelineService = {
  async getStages() {
    await delay(200);
    return [...stages].sort((a, b) => a.order - b.order);
  },

  async getStageById(id) {
    await delay(150);
    const stage = stages.find(stage => stage.Id === parseInt(id));
    if (!stage) {
      throw new Error("Pipeline stage not found");
    }
    return { ...stage };
  },

  async createStage(stageData) {
    await delay(300);
    const maxId = Math.max(...stages.map(stage => stage.Id), 0);
    const maxOrder = Math.max(...stages.map(stage => stage.order), 0);
    const newStage = {
      Id: maxId + 1,
      order: maxOrder + 1,
      color: "#6B7280",
      ...stageData
    };
    stages.push(newStage);
    return { ...newStage };
  },

  async updateStage(id, updateData) {
    await delay(250);
    const index = stages.findIndex(stage => stage.Id === parseInt(id));
    if (index === -1) {
      throw new Error("Pipeline stage not found");
    }
    stages[index] = {
      ...stages[index],
      ...updateData
    };
    return { ...stages[index] };
  },

  async deleteStage(id) {
    await delay(200);
    const index = stages.findIndex(stage => stage.Id === parseInt(id));
    if (index === -1) {
      throw new Error("Pipeline stage not found");
    }
    const deletedStage = stages.splice(index, 1)[0];
    return { ...deletedStage };
  }
};