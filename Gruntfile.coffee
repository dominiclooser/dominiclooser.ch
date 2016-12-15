time = require 'time-grunt'
jit = require 'jit-grunt'
autoprefixer = require 'autoprefixer'
cssVariables = require 'postcss-css-variables'

config =
    exec: 
        'harp': 'harp compile'
    'gh-pages':
        options:
            base: 'www'
        src: '**/*'
    postcss:
        options:
            processors: [autoprefixer({browers: 'last 2 versions'}), cssVariables ]

        dist:
            src: 'www/styles/styles.css'
    copy:
        main:
            src: ['images/*.*', 'CNAME']
            expand: true
            dest: 'www/'   
    stylus:
        main:
            src: 'styles/styles.styl'
            dest: 'www/styles/styles.css'
    yaml:
        main:
            expand: true
            src: ['**/_data.yml', '_harp.yml']
            ext: '.json'
    watch:
        options:
            livereload: true
        yaml:
            files: ['**/*.yml']
            tasks: ['yaml']
        all:
            files: ['**/*.*']
            tasks: []

module.exports = (grunt) ->
    grunt.initConfig config
    time grunt
    jit grunt
    grunt.registerTask 'default', ['yaml', 'watch']
    grunt.registerTask 'compile', ['yaml','force:on', 'exec:harp', 'copy', 'stylus', 'postcss']
    grunt.registerTask 'deploy', ['compile', 'gh-pages']