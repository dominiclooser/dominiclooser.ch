time = require 'time-grunt'
jit = require 'jit-grunt'
autoprefixer = require 'autoprefixer'
cssVariables = require 'postcss-css-variables'
calc = require 'postcss-calc'

config =
    teststage: 'psi stage.dominiclooser.ch'
    exec:
        harp: 'harp compile'
    'gh-pages':
        production:
            options:
                base: 'www'
            src: '**/*'
        stage:
            options:
                base: 'www'
                repo: 'git@github.com:dominiclooser/dominiclooser.ch-stage.git'
            src: '**/*'
    postcss:
        options:
            processors: [autoprefixer({browers: 'last 2 versions'}), cssVariables, calc]
        dist:
            src: 'www/styles/styles.css'
    copy:
        main:
            src: ['images/*.*', 'scripts/*.js']
            expand: true
            dest: 'www/'  
        'production-cname':
            src: '_production-cname'
            dest: 'www/CNAME'
        'stage-cname':
            src: '_stage-cname'
            dest: 'www/CNAME'
    coffee:
        main:
            expand: true
            flatten: true
            ext: '.js'
            src: 'scripts/*.coffee'
            dest: 'www/scripts/'
     
    stylus:
        main:
            src: 'styles/styles.styl'
            dest: 'www/styles/styles.css'
    yaml:
        main:
            expand: true
            src: ['**/_harp.yml', '**/_data.yml']
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
    grunt.registerTask 'compile', ['yaml','force:on', 'exec:harp','force:off', 'copy', 'stylus', 'postcss', 'coffee']
    grunt.registerTask 'deploy', ['compile','copy:production-cname', 'gh-pages:production']
    grunt.registerTask 'stage', ['compile','copy:stage-cname', 'gh-pages:stage']
    grunt.registerTask 'teststage', ['exec:teststage']