const Task = require('../models/Task');

const createTask = async (taskData) => {
  const task = await Task.create(taskData);
  return task;
};

const getTasks = async (query = {}) => {
  const tasks = await Task.find(query)
    .populate('project', 'title description status')
    .populate('assignee', 'name email role');
  return tasks;
};

const getTaskById = async (id) => {
  const task = await Task.findById(id)
    .populate('project', 'title description status')
    .populate('assignee', 'name email role');
  return task;
};

const updateTask = async (id, updateData) => {
  // If task status changes to 'done', set completionDate to now
  if (updateData.status && updateData.status.toLowerCase() === 'done') {
    updateData.completionDate = new Date();
  } else if (updateData.status) {
    updateData.completionDate = undefined; // Clear completion if moved out of done
  }

  const task = await Task.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true
  })
    .populate('project', 'title description status')
    .populate('assignee', 'name email role');
  return task;
};

const deleteTask = async (id) => {
  const task = await Task.findByIdAndDelete(id);
  return task;
};

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask
};
