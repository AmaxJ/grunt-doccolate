$(function () {

    var invertedIndex = <%= invertedIndex %>
    var mapById = <%= mapById %>
    var directory = <%= directory %>

    function changeExt (path, ext) {
        var parts = path.split('.')

        parts[parts.length - 1] = ext

        return parts.join('.')
    }

    function search (query) {
        var key
        var keys = []

        for (key in invertedIndex) {
            if (key.indexOf(query) >= 0) keys.push(key)
        }

        return keys
    }

    $('.typeahead').typeahead({
        highlight: false,
        minLength: 3,
    }, {
        limit: 20,
        source: function (query, cb) {
            var queries = query.toLowerCase().split(' ')
            // list of lists of relevant tokens
            var results = _.map(queries, function (query) { return search(query) })
            // intersection of tokens from each list
            var result = _.intersection.apply(_, results)
            var rankedResult = {}
            var path
            var id

            // consolidate rankings
            result.forEach(function (key) {
                for (id in invertedIndex[key]) {
                    if (!rankedResult[id]) rankedResult[id] = 0
                    rankedResult[id] += invertedIndex[key][id]
                }
            })

            // sort results on rank and render
            var matches = _.chain(rankedResult)
                .pairs()
                .sortBy(function (resultData) { return -resultData[1] })
                .map(function (resultData) { return mapById[resultData[0]] })
                .value()

            cb(matches)
        }
    }).bind('typeahead:select', function (ev, suggestion) {
        window.location = '/' + changeExt(suggestion, 'html')
    })

    var $directory = $('.fn-directory')

    function renderDirectory ($el, dir, isRoot) {
        if (_.isUndefined(isRoot)) isRoot = true

        var folders = []
        var $folderEl
        var $files

        // recursively render folders
        _.each(dir.folders, function (childDir, folder) {
            $folderEl = $('<ul class="' + (!isRoot ? 'hide' : '') + '"><li class="fn-folder"><span class="fn-symbol">+</span> ' + folder + '</li></ul>')
            $el.append($folderEl.wrap('<li />').parent())

            renderDirectory($folderEl, childDir, false)
        })

        // render files
        $files = $('<ul class="' + (!isRoot ? 'hide' : '') + '"></ul>')
        _.each(dir.files, function (file) {
            $files.append('<li><a href="/' + _.values(file)[0] + '">' + _.keys(file)[0] + '</a></li>')
        })
        $el.append($files.wrap('<li />').parent())
    }

    renderDirectory($directory, directory)

    $('.fn-folder').click(function () {
        var $this = $(this)
        var $symbol = $this.find('.fn-symbol')

        $symbol.html($symbol.text() === '+' ? '-' : '+')
        $this.parent().find('> li > ul').toggle()
    })
})
