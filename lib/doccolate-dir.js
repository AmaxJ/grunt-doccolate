var _ = require('underscore')
var path = require('path')

function build (sources) {
    var root = { files: [], folders: {} }
    var currentNode
    var file
    var part
    var parts

    _.each(sources, function (source) {
        parts = source.split('/')
        currentNode = root

        while (parts.length) {
            part = parts.shift()

            if (!parts.length) {
                file = {}
                file[path.basename(source)] = path.join(path.dirname(source), path.basename(source, path.extname(source)) + '.html')
                currentNode.files.push(file)
            } else {
                if (!currentNode.folders[part]) currentNode.folders[part] = { files: [], folders: {} }
                currentNode = currentNode.folders[part]
            }
        }
    })

    return root

}

module.exports = { build: build }
