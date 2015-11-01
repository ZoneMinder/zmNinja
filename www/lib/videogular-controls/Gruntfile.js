module.exports = function(grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		release: {
			options: {
				//bump: false, //default: true
				//file: 'bower.json', //default: package.json
				//add: false, //default: true
				//commit: false, //default: true
				//tag: false, //default: true
				//push: false, //default: true
				//pushTags: false, //default: true
				//npmtag: true, //default: no tag
				//folder: 'folder/to/publish/to/npm', //default project root
				//commitMessage: 'check out my release <%= version %>', //default: 'release <%= version %>'
				//tagMessage: 'tagging version <%= version %>', //default: 'Version <%= version %>',
				//tagName: 'v<%= version %>', //default: '<%= version %>'

				file: 'bower.json', //default: package.json
				add: false, //default: true
				commit: false, //default: true
				tag: false, //default: true
				push: false, //default: true
				pushTags: false, //default: true
				npm: false
			}
		}
	});

	grunt.loadNpmTasks('grunt-release');

	grunt.registerTask('major', ['release:major']);
	grunt.registerTask('minor', ['release:minor']);
	grunt.registerTask('patch', ['release:patch']);
};
