const Project = require('../models/Project');

const createProject = async (projectData) => {
  const project = await Project.create(projectData);
  return project;
};

const getProjects = async (query = {}) => {
  const projects = await Project.find(query).populate('owner', 'name email role');
  return projects;
};

const getProjectById = async (id) => {
  const project = await Project.findById(id).populate('owner', 'name email role');
  return project;
};

const updateProject = async (id, updateData) => {
  const project = await Project.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true
  }).populate('owner', 'name email role');
  return project;
};

const deleteProject = async (id) => {
  const project = await Project.findByIdAndDelete(id);
  return project;
};

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject
};
