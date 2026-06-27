const Report = require('../models/Report');

// @desc    Get all reports list
// @route   GET /api/reports
// @access  Private (Admin, Project Manager, Team Lead)
const getReports = async (req, res) => {
  try {
    const userRole = req.user.role ? req.user.role.toLowerCase() : '';
    const isDevOrTester = ['developer', 'tester'].includes(userRole);
    const filter = isDevOrTester ? { generatedBy: req.user.id } : {};

    const reports = await Report.find(filter)
      .populate('generatedBy', 'name email role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: reports.length,
      data: reports
    });
  } catch (error) {
    console.error('Get reports error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving reports list'
    });
  }
};

// @desc    Create/generate a new report record
// @route   POST /api/reports
// @access  Private (Admin, Project Manager, Team Lead)
const generateReport = async (req, res) => {
  try {
    const { title, type, format } = req.body;

    if (!title || !type || !format) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide report title, type (project/team/individual) and format (pdf/excel)'
      });
    }

    const report = await Report.create({
      title,
      generatedBy: req.user.id,
      type,
      format,
      fileUrl: `/exports/${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.${format.toLowerCase()}`
    });

    res.status(201).json({
      status: 'success',
      data: report
    });
  } catch (error) {
    console.error('Generate report error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Server error while generating report'
    });
  }
};

module.exports = {
  getReports,
  generateReport
};
