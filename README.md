# grunt-doccolate
Doccolate is a documentation generator that adds token based search with typeahead.

The generator portion is based off of [docco](https://github.com/jashkenas/docco).

### Why another documentation generator?
* I gave [groc](http://nevir.github.io/groc/) a fair shot, but the search functionality was too basic.

### Implementation
I created an inverted index which maps tokens to files, with their respective frequencies in each file. The frequencies enabled a basic ranking system. You're able to search by token, filename and can include multiple terms in a query. It uses an `AND` filter when combining index results.

### Installing grunt-doccolate
Add the following to your package.json file under dependencies
```
"grunt-doccolate": "jperler/grunt-doccolate"
```

Install the lib
```bash
$ npm install
```

Update your Gruntfile
```
doccolate: {
    ui: {
        src: ['src/**/*.js', 'src/**/*.jsx'],
        options: {
            output: 'docs/',
            port: 8084,
            title: 'Doccolate Documentation',
        },
    }
},
```

### Running grunt-doccolate
This will mimic the `src` directories and create an html file for every matched file.
```bash
$ grunt doccolate
```

When everything is done compiling it'll start a lightweight server based off of the provided port. You'll see output with where it's running. e.g. ```doccolate: server running on http://localhost:8084```
