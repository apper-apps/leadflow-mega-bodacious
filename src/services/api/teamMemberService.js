import teamMembersData from "@/services/mockData/teamMembers.json";

let teamMembers = [...teamMembersData];

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const teamMemberService = {
  async getAll() {
    await delay(200);
    return teamMembers.map(member => ({ ...member }));
  },

  async getById(id) {
    await delay(200);
    const member = teamMembers.find(member => member.Id === parseInt(id));
    if (!member) {
      throw new Error("Team member not found");
    }
    return { ...member };
  },

  async getActive() {
    await delay(200);
    return teamMembers
      .filter(member => member.isActive)
      .map(member => ({ ...member }));
  },

  async create(memberData) {
    await delay(400);
    const maxId = Math.max(...teamMembers.map(member => member.Id), 0);
    const newMember = {
      Id: maxId + 1,
      ...memberData,
      isActive: memberData.isActive !== undefined ? memberData.isActive : true,
      createdAt: new Date().toISOString()
    };
    teamMembers.push(newMember);
    return { ...newMember };
  },

  async update(id, updateData) {
    await delay(350);
    const index = teamMembers.findIndex(member => member.Id === parseInt(id));
    if (index === -1) {
      throw new Error("Team member not found");
    }
    teamMembers[index] = {
      ...teamMembers[index],
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    return { ...teamMembers[index] };
  },

  async delete(id) {
    await delay(300);
    const index = teamMembers.findIndex(member => member.Id === parseInt(id));
    if (index === -1) {
      throw new Error("Team member not found");
    }
    const deletedMember = { ...teamMembers[index] };
    teamMembers.splice(index, 1);
    return deletedMember;
  }
};