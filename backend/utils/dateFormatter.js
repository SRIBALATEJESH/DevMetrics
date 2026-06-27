// Simple date formatter utilities
const formatLocalTime = (date) => {
  return new Date(date).toLocaleString();
};

const formatDateOnly = (date) => {
  return new Date(date).toLocaleDateString();
};

module.exports = {
  formatLocalTime,
  formatDateOnly
};
