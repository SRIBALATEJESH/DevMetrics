const Team = require('../models/Team');

const createTeam = async (teamData) => {
  const team = await Team.create(teamData);
  return team;
};

const getTeams = async (query = {}) => {
  const teams = await Team.find(query)
    .populate('lead', 'name email role')
    .populate('members', 'name email role')
    .populate('project', 'title description status');
  return teams;
};

const getTeamById = async (id) => {
  const team = await Team.findById(id)
    .populate('lead', 'name email role')
    .populate('members', 'name email role')
    .populate('project', 'title description status');
  return team;
};

const updateTeam = async (id, updateData) => {
  const team = await Team.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true
  })
    .populate('lead', 'name email role')
    .populate('members', 'name email role')
    .populate('project', 'title description status');
  return team;
};

const deleteTeam = async (id) => {
  const team = await Team.findByIdAndDelete(id);
  return team;
};

module.exports = {
  createTeam,
  getTeams,
  getTeamById,
  updateTeam,
  deleteTeam
};
