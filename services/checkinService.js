const db = require('../config/database');
const Checkin = require('../models/Checkin');

function create(memberId, data = {}) {
    const checkinDate = data.checkin_date || data.date || db.prepare("SELECT date('now', 'localtime') AS value").get().value;
    const checkinTime = data.checkin_time || data.time || db.prepare("SELECT time('now', 'localtime') AS value").get().value;

    const checkinId = Checkin.create(memberId, checkinDate, checkinTime);
    return Checkin.findById(checkinId);
}

function list() {
    return Checkin.findAll();
}

function findByMemberId(memberId) {
    return Checkin.findByMemberId(memberId);
}

module.exports = {
    create,
    list,
    findByMemberId
};
