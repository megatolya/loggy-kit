module.exports = function(grunt) {

  grunt.initConfig({
    nodewebkit: {
      options: {
        build_dir: './build',
        credits: './src/credits.html',
        mac: true,
        win: true,
        linux32: false,
        linux64: false
      },
      src: './src/**/*'
    },
  });

  grunt.loadNpmTasks('grunt-node-webkit-builder');
  grunt.registerTask('default', ['nodewebkit']);

};
