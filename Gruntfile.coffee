time = require 'time-grunt'
jit = require 'jit-grunt'
autoprefixer = require 'autoprefixer'
cssVariables = require 'postcss-css-variables'
calc = require 'postcss-calc'

config =
    responsive_images:
        options:
            engine: 'im'
            newFilesOnly: false
        'graphics-small':
            options:
                sizes: [{rename: false, width: 400}]
            files: [
                    expand: true
                    cwd: 'raw-images/graphics/'
                    src: '*'
                    dest: 'public/images/graphics/small/'
            ]
        'graphics-large':
            options:
                sizes: [{rename: false, width: 1000}]
            files: [
                    expand: true
                    cwd: 'raw-images/graphics/'
                    src: '*'
                    dest: 'public/images/graphics/large/'
            ]

    exec:
        textimport: 'bin/import-texts' 
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
        main:
            src: 'www/styles/styles.css'

    copy:
        main:
            src: ['images/**/*', 'scripts/*.js', 'favicon.ico']
            cwd: 'public'
            expand: true
            dest: 'www/' 
        'production':
            src: 'cnames/production'
            dest: 'www/CNAME'
        'stage':
            src: 'cnames/stage'
            dest: 'www/CNAME'

    coffee:
        main:
            expand: true
            flatten: true
            ext: '.js'
            src: 'public/scripts/*.coffee'
            dest: 'www/scripts/'

    stylus:
        main:
            src: 'public/styles/styles.styl'
            dest: 'www/styles/styles.css'

    yaml:
        main:
            expand: true
            src: ['harp.yml', 'public/**/_data.yml']
            ext: '.json'
            
    watch:
        options:
            livereload: true
        yaml:
            files: ['**/*.yml']
            tasks: ['yaml']
        images:
            files: ['raw-images/graphics/*']
            tasks: ['responsive_images']
        texts:
            files: '~/text/ready/*'
            tasks: 'exec:textimport'
        all:
            files: ['**/*.*']
            tasks: []

module.exports = (grunt) ->
    grunt.initConfig config
    time grunt
    jit grunt
    grunt.registerTask 'default', ['yaml', 'watch'] 
    grunt.registerTask 'compile', ['exec:textimport', 'yaml','force:on', 'exec:harp','force:off', 'copy:main', 'stylus', 'postcss', 'coffee']
    grunt.registerTask 'deploy', ['compile','copy:production', 'gh-pages:production']
    grunt.registerTask 'stage', ['compile','copy:stage', 'gh-pages:stage']