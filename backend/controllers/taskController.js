const taskService = require('../services/taskService');
const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');
const { recalculateAllMetrics } = require('../services/analyticsEngineService');

// @desc    Create new task
// @route   POST /api/tasks
// @access  Private (Admin, Project Manager, Team Lead)
const createTask = async (req, res) => {
  try {
    const { title, description, project, assignee, status, priority, complexity, deadline } = req.body;

    if (!title || !project) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide task title and project ID'
      });
    }

    const task = await taskService.createTask({
      title,
      description,
      project,
      assignee,
      status: status || 'todo',
      priority: priority || 'medium',
      complexity: complexity || 'medium',
      deadline
    });

    // Create activity logs and notifications
    if (task.assignee) {
      const assigneeId = task.assignee._id || task.assignee;
      await Notification.create({
        user: assigneeId,
        message: `You have been assigned a new task: "${task.title}"`,
        type: 'task'
      });
      await ActivityLog.create({
        user: assigneeId,
        event: `Task assigned: "${task.title}"`,
        metadata: { taskId: task._id }
      });
    }

    // Recalculate metrics in background
    recalculateAllMetrics().catch(err => console.error('Recalculate error in task create:', err));

    res.status(201).json({
      status: 'success',
      data: task
    });
  } catch (error) {
    console.error('Create task error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Server error while creating task'
    });
  }
};

// @desc    Get all tasks
// @route   GET /api/tasks
// @access  Private
const getTasks = async (req, res) => {
  try {
    const filter = {};
    // Optional query filters
    if (req.query.project) filter.project = req.query.project;
    if (req.query.assignee) filter.assignee = req.query.assignee;
    if (req.query.status) filter.status = req.query.status;

    const tasks = await taskService.getTasks(filter);

    res.status(200).json({
      status: 'success',
      results: tasks.length,
      data: tasks
    });
  } catch (error) {
    console.error('Get tasks error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving tasks'
    });
  }
};

// @desc    Get task by ID
// @route   GET /api/tasks/:id
// @access  Private
const getTaskById = async (req, res) => {
  try {
    const task = await taskService.getTaskById(req.params.id);

    if (!task) {
      return res.status(404).json({
        status: 'fail',
        message: 'Task not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: task
    });
  } catch (error) {
    console.error('Get task by id error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving task details'
    });
  }
};

// @desc    Update task details or status
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = async (req, res) => {
  try {
    const task = await taskService.getTaskById(req.params.id);

    if (!task) {
      return res.status(404).json({
        status: 'fail',
        message: 'Task not found'
      });
    }

    // Auth constraints:
    // Admin, PM, Team Lead can edit anything.
    // Developer & Tester can ONLY edit if they are the assignee.
    const isAssignee = task.assignee && task.assignee.id === req.user.id;
    const isManagement = ['admin', 'project manager', 'team lead'].includes(req.user.role.toLowerCase());

    if (!isManagement && !isAssignee) {
      return res.status(403).json({
        status: 'fail',
        message: 'Forbidden: You are not authorized to update this task'
      });
    }

    const oldStatus = task.status;
    const updatedTask = await taskService.updateTask(req.params.id, req.body);

    // Track status transitions in ActivityLog & Notifications
    if (req.body.status && req.body.status !== oldStatus) {
      const assigneeId = updatedTask.assignee?._id || updatedTask.assignee;
      if (assigneeId) {
        await ActivityLog.create({
          user: assigneeId,
          event: `Task status updated: "${updatedTask.title}" is now ${updatedTask.status}`,
          metadata: { taskId: updatedTask._id, status: updatedTask.status }
        });

        if (updatedTask.status.toLowerCase() === 'done') {
          await Notification.create({
            user: assigneeId,
            message: `Task completed: "${updatedTask.title}"`,
            type: 'task'
          });
        }
      }
    }

    // Recalculate metrics in background
    recalculateAllMetrics().catch(err => console.error('Recalculate error in task update:', err));

    res.status(200).json({
      status: 'success',
      data: updatedTask
    });
  } catch (error) {
    console.error('Update task error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Server error updating task details'
    });
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private (Admin, Project Manager)
const deleteTask = async (req, res) => {
  try {
    const task = await taskService.getTaskById(req.params.id);

    if (!task) {
      return res.status(404).json({
        status: 'fail',
        message: 'Task not found'
      });
    }

    await taskService.deleteTask(req.params.id);

    res.status(200).json({
      status: 'success',
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Delete task error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Server error deleting task'
    });
  }
};

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask
};
