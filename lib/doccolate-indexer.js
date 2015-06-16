var _ = require('underscore')
var path = require('path')
var fs = require('fs-extra')

var STOP_WORDS = ['//', 'var', '||', 'return', '+', '-', '*', '/', '%', 'true', 'false', '?', ':', 'require', 'function']
var SPLIT_REGEX = /[(){}_=\/\s'",.]+/

function build (options, grunt) {
    var invertedIndex = {}
    var mapByPath = {}
    var mapById = {}
    var tokens
    var source
    var currentIndex
    var i = 0

    options.args.forEach(function (filepath) {
        source = grunt.file.read(filepath)
        tokens = tokenize(source)

        // create a path lookup
        if (!mapByPath[filepath]) {
            mapByPath[filepath] = i
            mapById[i] = filepath
            i++
        }

        currentIndex = mapByPath[filepath]

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
        .filter(function (token) { return !/^[0-9]+$/.test(token) })
        .difference(STOP_WORDS)
        .value()
}

module.exports = { build: build }
