const os = require('os');

module.exports = process.env.INSTANCE_ID || os.hostname();
