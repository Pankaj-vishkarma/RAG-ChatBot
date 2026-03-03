const logInfo = (message) => {
  console.log(`ℹ️ INFO: ${message}`);
};

const logError = (message) => {
  console.error(`❌ ERROR: ${message}`);
};

module.exports = {
  logInfo,
  logError,
};