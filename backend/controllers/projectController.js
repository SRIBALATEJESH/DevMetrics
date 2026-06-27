const projectService = require('../services/projectService');
const User = require('../models/User');

// @desc    Create new project
// @route   POST /api/projects
// @access  Private (Admin, Project Manager)
const createProject = async (req, res) => {
  try {
    const { title, description, startDate, endDate, status, priority } = req.body;

    if (!title) {
      return res.status(404).json({
        status: 'fail',
        message: 'Please provide a project title'
      });
    }

    const projectData = {
      title,
      description,
      owner: req.user.id, // The logged-in user is the owner
      startDate,
      endDate,
      status: status || 'planned',
      priority: priority || 'medium'
    };

    const project = await projectService.createProject(projectData);

    res.status(201).json({
      status: 'success',
      data: project
    });
  } catch (error) {
    console.error('Create project error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Server error while creating project'
    });
  }
};

// @desc    Get all projects
// @route   GET /api/projects
// @access  Private
const getProjects = async (req, res) => {
  try {
    const projects = await projectService.getProjects();

    res.status(200).json({
      status: 'success',
      results: projects.length,
      data: projects
    });
  } catch (error) {
    console.error('Get projects error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving projects list'
    });
  }
};

// @desc    Get single project details
// @route   GET /api/projects/:id
// @access  Private
const getProjectById = async (req, res) => {
  try {
    const project = await projectService.getProjectById(req.params.id);

    if (!project) {
      return res.status(404).json({
        status: 'fail',
        message: 'Project not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: project
    });
  } catch (error) {
    console.error('Get project by id error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving project details'
    });
  }
};

// @desc    Update project details
// @route   PUT /api/projects/:id
// @access  Private (Admin, Project Manager)
const updateProject = async (req, res) => {
  try {
    let project = await projectService.getProjectById(req.params.id);

    if (!project) {
      return res.status(404).json({
        status: 'fail',
        message: 'Project not found'
      });
    }

    // Check ownership / admin permissions
    if (req.user.role !== 'admin' && project.owner.id !== req.user.id) {
      return res.status(403).json({
        status: 'fail',
        message: 'Forbidden: You are not authorized to update this project'
      });
    }

    const updatedProject = await projectService.updateProject(req.params.id, req.body);

    res.status(200).json({
      status: 'success',
      data: updatedProject
    });
  } catch (error) {
    console.error('Update project error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Server error updating project details'
    });
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private (Admin)
const deleteProject = async (req, res) => {
  try {
    const project = await projectService.getProjectById(req.params.id);

    if (!project) {
      return res.status(404).json({
        status: 'fail',
        message: 'Project not found'
      });
    }

    await projectService.deleteProject(req.params.id);

    res.status(200).json({
      status: 'success',
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('Delete project error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Server error deleting project'
    });
  }
};

// @desc    Toggle favorite status of a project
// @route   POST /api/projects/:id/favorite
// @access  Private
const toggleFavoriteProject = async (req, res) => {
  try {
    const projectId = req.params.id;
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ status: 'fail', message: 'User not found' });
    }

    const isFav = user.favoriteProjects.includes(projectId);
    if (isFav) {
      user.favoriteProjects = user.favoriteProjects.filter(id => id.toString() !== projectId);
    } else {
      user.favoriteProjects.push(projectId);
    }
    await user.save();

    res.status(200).json({
      status: 'success',
      isFavorite: !isFav,
      message: !isFav ? 'Project added to favorites' : 'Project removed from favorites'
    });
  } catch (error) {
    console.error('Toggle favorite project error:', error.message);
    res.status(500).json({ status: 'error', message: 'Server error toggling project favorite status' });
  }
};

const getProjectBurndown = async (req, res) => {
  try {
    const Task = require('../models/Task');
    const Project = require('../models/Project');
    
    const projectId = req.params.id;
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ status: 'fail', message: 'Project not found' });
    }

    const tasks = await Task.find({ project: projectId });
    const totalTasks = tasks.length;

    const startDate = new Date(project.startDate || project.createdAt);
    const endDate = project.endDate ? new Date(project.endDate) : new Date();

    const end = endDate > new Date() ? new Date() : endDate;
    
    const dates = [];
    let curr = new Date(startDate);
    curr.setHours(0, 0, 0, 0);
    const stop = new Date(end);
    stop.setHours(23, 59, 59, 999);

    let count = 0;
    while (curr <= stop && count < 60) {
      dates.push(new Date(curr));
      curr.setDate(curr.getDate() + 1);
      count++;
    }

    const burndownData = dates.map((date, idx) => {
      const totalDays = dates.length - 1 || 1;
      const idealRemaining = Math.max(0, Math.round(totalTasks - (idx * (totalTasks / totalDays))));

      const completedOnOrBefore = tasks.filter(t => {
        if (t.status.toLowerCase() !== 'done') return false;
        if (!t.completionDate) return false;
        const compDate = new Date(t.completionDate);
        compDate.setHours(0, 0, 0, 0);
        return compDate <= date;
      }).length;

      const actualRemaining = totalTasks - completedOnOrBefore;

      return {
        date: date.toLocaleDateString('en-CA'),
        ideal: idealRemaining,
        actual: actualRemaining
      };
    });

    res.status(200).json({
      status: 'success',
      data: burndownData
    });
  } catch (error) {
    console.error('Get project burndown error:', error.message);
    res.status(500).json({ status: 'error', message: 'Server error retrieving project burndown analytics' });
  }
};

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  toggleFavoriteProject,
  getProjectBurndown
};
