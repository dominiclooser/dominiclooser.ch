time = require 'time-grunt'
jit = require 'jit-grunt'
autoprefixer = require 'autoprefixer'

config =
    'exec': 
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
            src: []
            expand: true
            dest: 'www/'
        
    stylus:
        main:
            src: 'styles/styles.styl'
            dest: 'www/styles/styles.css'
    yaml:
        main:
            expand: true
            src: ['**/_data.yml']
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
    grunt.registerTask 'finish', ['copy', 'stylus' , 'postcss']
    grunt.registerTask 'deploy', ['force:exec', 'finish', 'gh-pages']