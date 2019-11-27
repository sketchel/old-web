const path = require('path')

exports.sitemap = function(req, res) {
    res.sendFile(path.join(__dirname, '../map.xml'));
}