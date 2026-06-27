const teamService = require('../services/teamService');

// @desc    Create new team
// @route   POST /api/teams
// @access  Private (Admin, Project Manager)
const createTeam = async (req, res) => {
  try {
    const { teamName, lead, members, project } = req.body;

    if (!teamName || !lead) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide teamName and team lead ID'
      });
    }

    const team = await teamService.createTeam({
      teamName,
      lead,
      members: members || [],
      project
    });

    res.status(201).json({
      status: 'success',
      data: team
    });
  } catch (error) {
    console.error('Create team error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Server error while creating team'
    });
  }
};

// @desc    Get all teams
// @route   GET /api/teams
// @access  Private
const getTeams = async (req, res) => {
  try {
    const filter = {};
    if (req.query.project) {
      filter.project = req.query.project;
    }
    const teams = await teamService.getTeams(filter);

    res.status(200).json({
      status: 'success',
      results: teams.length,
      data: teams
    });
  } catch (error) {
    console.error('Get teams error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving teams list'
    });
  }
};

// @desc    Get team by ID
// @route   GET /api/teams/:id
// @access  Private
const getTeamById = async (req, res) => {
  try {
    const team = await teamService.getTeamById(req.params.id);

    if (!team) {
      return res.status(404).json({
        status: 'fail',
        message: 'Team not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: team
    });
  } catch (error) {
    console.error('Get team by id error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving team details'
    });
  }
};

// @desc    Update team
// @route   PUT /api/teams/:id
// @access  Private (Admin, Project Manager, Team Lead)
const updateTeam = async (req, res) => {
  try {
    const team = await teamService.getTeamById(req.params.id);

    if (!team) {
      return res.status(404).json({
        status: 'fail',
        message: 'Team not found'
      });
    }

    // Authorization checks: Only Admin, Project Manager or the Team Lead of that team
    const isTeamLead = team.lead && team.lead.id === req.user.id;
    const requesterRole = req.user.role ? req.user.role.toLowerCase() : '';
    if (requesterRole !== 'admin' && requesterRole !== 'project manager' && !isTeamLead) {
      return res.status(403).json({
        status: 'fail',
        message: 'Forbidden: You are not authorized to update this team'
      });
    }

    const updatedTeam = await teamService.updateTeam(req.params.id, req.body);

    res.status(200).json({
      status: 'success',
      data: updatedTeam
    });
  } catch (error) {
    console.error('Update team error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Server error updating team details'
    });
  }
};

// @desc    Delete team
// @route   DELETE /api/teams/:id
// @access  Private (Admin)
const deleteTeam = async (req, res) => {
  try {
    const team = await teamService.getTeamById(req.params.id);

    if (!team) {
      return res.status(404).json({
        status: 'fail',
        message: 'Team not found'
      });
    }

    await teamService.deleteTeam(req.params.id);

    res.status(200).json({
      status: 'success',
      message: 'Team deleted successfully'
    });
  } catch (error) {
    console.error('Delete team error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Server error deleting team'
    });
  }
};

module.exports = {
  createTeam,
  getTeams,
  getTeamById,
  updateTeam,
  deleteTeam
};
