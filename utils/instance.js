const os = require('os');

// Identifica qual réplica atendeu a requisição (útil para demonstrar o load balancing)
module.exports = process.env.INSTANCE_ID || os.hostname();
