module.exports = function (grunt) {
  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    ts: {
      options: require('./tsconfig.json').compilerOptions,
      default: {
        src: ['src/**/*.ts', '!node_modules/**'],
        outDir: 'dist',
      }
    },

    watch: {
      'ts': {
        files: ['src/**/*.ts'],
        tasks: ['ts']
      }
    },

    clean: ['dist']
  });

  grunt.registerTask('default', ['ts']);
  grunt.registerTask('w', ['default', 'watch']);
};
