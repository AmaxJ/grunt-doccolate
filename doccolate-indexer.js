var _ = require('underscore')
var path = require('path')
var fs = require('fs-extra')

var STOPWORDS = ['//', 'var', '||', 'return', '+', '-', '*', '/', '%', 'true', 'false', '?', ':']
var SPLIT_REGEX = /[(){}_=\/\s'",.]+/
var INDEX_FILENAME = 'invertedIndex.js'


function build (options, grunt) {
    var invertedIndex = {}
    var mapByPath = {}
    var mapById = {}
    var docPath
    var tokens
    var source
    var currentIndex
    var i = 0

    options.args.forEach(function (filepath) {
        docPath = getDocPath(filepath)
        source = grunt.file.read(filepath)
        tokens = tokenize(source)

        // create a path lookup
        if (!mapByPath[docPath]) {
            currentIndex = i
            mapByPath[docPath] = i
            mapById[i] = docPath
            i++
        }

        // make file searchable by name
        invertedIndex[filepath] = {}
        invertedIndex[filepath][currentIndex] = 1

        // make file searchable by tokens
        tokens.forEach(function (token) {
            if (!invertedIndex[token]) invertedIndex[token] = {}
            if (!invertedIndex[token][currentIndex]) invertedIndex[token][currentIndex] = 0
            invertedIndex[token][currentIndex]++
        })
    })

    return {
        invertedIndex: invertedIndex,
        mapById: mapById,
    }
}

function tokenize (code) {
    return _.chain(code.split(SPLIT_REGEX))
        .map(function (token) { return token.trim().toLowerCase() })
        .difference(STOPWORDS)
        .value()
}

function getDocPath (filepath) {
    return path.join(path.dirname(filepath), path.basename(filepath, path.extname(filepath)) + '.html')
}

module.exports = { build: build }
