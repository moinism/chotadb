
module.exports = function(grunt) {

  grunt.loadNpmTasks('grunt-contrib-jshint');
  // grunt.loadNpmTasks('grunt-contrib-qunit');
  // grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
      all: ['src/*.js']
    },
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %>.js v<%= pkg.version %> built on <%= grunt.template.today("yyyy-mm-dd") %> - (c) <%= grunt.template.today("yyyy") %> <%= pkg.author %> */\n'
      },
      build: {
        src: 'src/<%= pkg.name %>.js',
        dest: 'build/<%= pkg.name %>.min.js'
      }
    }
    // concat: {
    //   license: {
    //     src: ['LICENSE', 'build/<%= pkg.name %>.min.js'],
    //     dest: 'build/<%= pkg.name %>.min.js',
    //   },
    // }
  });

  grunt.registerTask('default', [
      'uglify',
      'jshint'
    ]);
};
