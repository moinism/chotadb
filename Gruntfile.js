
module.exports = function(grunt) {

  grunt.loadNpmTasks('grunt-contrib-jshint');
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
        banner: '/*! \n <%= pkg.name %>.js v<%= pkg.version %> generated on <%= grunt.template.today("dd-mm-yyyy HH:MM:ss") %> - (c) <%= grunt.template.today("yyyy") %> <%= pkg.author %> \n Available under MIT license. - <%= pkg.homepage %> \n*/\n'
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
