var _ = require('underscore')
var fs = require('fs-extra')
var path = require('path')
var marked = require('marked')
var highlightjs = require('highlight.js')
var indexer = require('../lib/doccolate-indexer')
var dir = require('../lib/doccolate-dir')
var static = require('node-static')
var http = require('http')

var LANGUAGES = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'resources', 'languages.json')))
var VERSION = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'))).version
var DEFAULTS = {
    layout: 'doccolate',
    output: 'docs',
    template: null,
    css: null,
    extension: null,
    languages: {},
    marked: null,
}

var languages = buildMatchers(LANGUAGES)

function document (options, grunt, callback) {
    var config = configure(options)
    var complete = function () {
        // create search index
        var index = indexer.build(options, grunt)
        var jsTemplate = _.template(grunt.file.read(config.js))
        var jsTemplatePath = path.join(config.output, path.basename(config.js, path.extname(config.js)) + '.js')

        grunt.file.write(jsTemplatePath, jsTemplate({
            invertedIndex: JSON.stringify(index.invertedIndex),
            mapById: JSON.stringify(index.mapById),
            directory: JSON.stringify(dir.build(config.sources)),
        }))

        grunt.file.write(path.join(config.output, 'index.html'), config.template({
            jsFile: path.basename(config.js, path.extname(config.js)) + '.js',
            cssFile: path.basename(config.css),
            title: config.title || 'Documentation',
            hasTitle: false,
            sections: [],
            path: path,
            breadcrumbs: [],
        }))

        grunt.file.copy(config.css, path.join(config.output, path.basename(config.css)))

        if (fs.existsSync(config.public)) {
            fs.copySync(config.public, path.join(config.output, path.basename(config.public)))
        }

        callback()
    }

    return fs.mkdirs(config.output, function() {
        var files = config.sources.slice()
        var nextFile = function() {
            var source = files.shift()

            return fs.readFile(source, function (error, buffer) {
                var code = buffer.toString()
                var sections = parse(source, code, config)

                format(source, sections, config)
                write(source, sections, config)

                return files.length ? nextFile() : complete()
            })
        }

        return nextFile()
    })
}

function parse (source, code, config) {
    if (!config) config = {}

    var codeText = ''
    var docsText = ''
    var sections = []
    var lines = code.split('\n')
    var lang = getLanguage(source, config)
    var hasCode = docsText = codeText = ''
    var multilineOpen = false
    var openTagFound
    var closeTagFound
    var closeSeen
    var isValidMultiline = false
    var save = function() {
        sections.push({ docsText: docsText, codeText: codeText })
        hasCode = docsText = codeText = ''
    }

    lines.forEach(function (line, i) {
        if (lang.multiline) {
            openTagFound = line.indexOf(lang.open) >= 0
            // only register closing tags when the multiline open flag is true
            closeTagFound = multilineOpen && line.indexOf(lang.close) >= 0

            // prevent opening when a line both opens and closes
            if (openTagFound && !closeTagFound) multilineOpen = true
            if (closeTagFound) multilineOpen = false

            if (multilineOpen) {
                // if we're open, make sure we close before we open again
                lines.slice(i + 1).forEach(function (anotherLine) {
                    if (anotherLine.indexOf(lang.close) >= 0) closeSeen = true
                    // if we are opening again before we've closed, ignore multiline
                    if (anotherLine.indexOf(lang.open) >= 0 && !closeSeen) multilineOpen = false
                })
                // if if we're still open and there was never a close, ignore multiline
                if (multilineOpen && !closeSeen) multilineOpen = false
                // reset
                closeSeen = false
            }

            // if we're still open or we're closing (and not also opening)
            isValidMultiline = multilineOpen || (closeTagFound && !openTagFound)
        }

        if ((line.match(lang.commentMatcher) || isValidMultiline) && !line.match(lang.commentFilter)) {
            if (hasCode) save()
            if (multilineOpen || closeTagFound) {
                line = line.replace(lang.open, '')
                line = line.replace(lang.close, '')
            } else {
                line = line.replace(lang.commentMatcher, '')
            }
            docsText += line + '\n'
            // reset
            isValidMultiline = false
            if (/^(---+|===+)$/.test(line)) save()
        } else {
            hasCode = true
            codeText += line + '\n'
        }
    })

    save()

    return sections
}

function format (source, sections, config) {
    var language = getLanguage(source, config)
    var markedOptions = { smartypants: true }
    var results = []
    var code

    if (config.marked) markedOptions = config.marked

    marked.setOptions(markedOptions)
    marked.setOptions({
        highlight: function (code, lang) {
            if (!lang) lang = language.name

            if (highlightjs.getLanguage(lang)) {
                return highlightjs.highlight(lang, code).value
            } else {
                console.warn("doccolate: couldn't highlight code block with unknown language '" + lang + "' in " + source)
                return code
            }
        }
    })

    sections.forEach(function (section) {
        code = highlightjs.highlight(language.name, section.codeText).value
        code = code.replace(/\s+$/, '')
        section.codeHtml = "<div class='highlight'><pre>" + code + "</pre></div>"
        results.push(section.docsHtml = marked(section.docsText))
    })

    return results
}


function write (source, sections, config) {
    var first
    var hasTitle
    var html
    var title

    var destination = function(file) {
        return path.join(config.output, file, '..', path.basename(file, path.extname(file)) + '.html')
    }

    var firstSection = _.find(sections, function (section) {
        return section.docsText.length > 0
    })

    if (firstSection) {
        first = marked.lexer(firstSection.docsText)[0]
    }

    hasTitle = first && first.type === 'heading' && first.depth === 1
    title = hasTitle ? first.text : path.basename(source)
    html = config.template({
        jsFile: path.basename(config.js, path.extname(config.js)) + '.js',
        cssFile: path.basename(config.css),
        title: title,
        hasTitle: hasTitle,
        sections: sections,
        path: path,
        breadcrumbs: path.dirname(source).split('/'),
    })

    console.log("doccolate: " + source + " -> " + (destination(source)))

    // create the directory if it doesn't exist
    fs.mkdirsSync(path.join(config.output, source, '..'))

    return fs.writeFileSync(destination(source), html)
}

function configure (options) {
    var config = _.extend({}, DEFAULTS, options)
    var dir

    config.languages = buildMatchers(config.languages)

    if (options.template) {
        if (!options.css) console.warn("doccolate: no stylesheet file specified")
        if (!options.js) console.warn("doccolate: no js template file specified")
        config.layout = null
    } else {
        dir = config.layout = path.join(__dirname, '..', 'resources', config.layout)
        config.template = path.join(dir, 'doccolate.html')
        config.css = options.css || path.join(dir, 'doccolate.css')
        config.js = options.js || path.join(dir, 'doccolate.js')
        config.public = path.join(dir, 'public')
    }

    config.template = _.template(fs.readFileSync(config.template).toString())

    if (options.marked) {
        config.marked = JSON.parse(fs.readFileSync(options.marked))
    }

    config.sources = options.args.filter(function(source) {
        var lang = getLanguage(source, config)

        if (!lang) console.warn("doccolate: skipped unknown type (" + (path.basename(source)) + ")")

        return lang
    }).sort()

    return config
}

function buildMatchers (languages) {
    var ext
    var language

    for (ext in languages) {
        language = languages[ext]
        language.commentMatcher = RegExp("^\\s*" + language.symbol + "\\s?")
        language.commentFilter = /(^#![\/]|^\s*#\{)/
    }

    return languages
}

function getLanguage (source, config) {
    var ext = path.extname(source)
    var language = config.languages[ext] || languages[ext]
    var codeExt
    var codeLang

    if (language && language.name === 'markdown') {
        codeExt = path.extname(path.basename(source, ext))
        if (codeExt && (codeLang = languages[codeExt])) {
            language = _.extend({}, codeLang, {
                literate: true
            })
        }
    }

    return language
}

function startServer (options) {
    var fileServer = new static.Server(options.output)

    http.createServer(function (request, response) {
        fileServer.serve(request, response)
    }).on('listening', function () {
        console.log("doccolate: server running on http://localhost:" + options.port)
    }).listen(options.port)
}

module.exports = function (grunt) {
    grunt.registerMultiTask('doccolate', '', function () {
        var done = this.async()
        var options = this.options({ args: this.filesSrc })

        // create documentation & start server
        document(options, grunt, startServer.bind(this, options))
    })
}
