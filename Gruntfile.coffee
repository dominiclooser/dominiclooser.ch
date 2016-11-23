time = require 'time-grunt'
jit = require 'jit-grunt'
autoprefixer = require 'autoprefixer'

config =
    preprocess:
        slashbase: 
            src: '_base.pre'
            dest: '_base.jade' 
        ghbase:
            src: '_base.pre'
            dest: '_base.jade'
            options:
                context:
                    ghbase: true

    exec: 
        'harp': 'harp compile'
    'gh-pages':
        options:
            base: 'www'
        src: '**/*'
    postcss:
        options:
            processors:
                autoprefixer
                    browers: 'last 2 versions'
        dist:
            src: 'www/styles/styles.css'
    copy:
        main:
            src: ['images/*.*']
            expand: true
            dest: 'www/'   
    stylus:
        main:
            src: 'styles/styles.styl'
            dest: 'www/styles/styles.css'
    yaml:
        main:
            expand: true
            src: ['**/_data.yml', '_harp.yml', 'harp.yml']
            ext: '.json'
    watch:
        options:
            livereload: true
        yaml:
            files: ['**/*.yml']
            tasks: ['yaml']
        base:
            files: ['_base.pre']
            tasks: ['preprocess:slashbase']
        all:
            files: ['**/*.*']
            tasks: []

module.exports = (grunt) ->
    grunt.initConfig config
    time grunt
    jit grunt
    grunt.registerTask 'default', ['yaml', 'preprocess:slashbase', 'watch']
    grunt.registerTask 'finish', ['copy', 'stylus' , 'postcss']
    grunt.registerTask 'deploy', ['force:on','preprocess:ghbase', 'exec', 'finish', 'gh-pages', 'preprocess:slashbase']