module.exports = function(karma) {
  karma.set({

    frameworks: [ 'browserify', 'mocha', 'chai' ],

    files: [
      'test/*Spec.js'
    ],

    preprocessors: {
      'test/*Spec.js': [ 'browserify' ]
    },

    reporters: [ 'progress' ],

    browsers: [ 'PhantomJS' ],

    singleRun: true,
    autoWatch: false,

    // browserify configuration
    browserify: {
      transform: [
        [ 'stringify', {
          global: true,
          extensions: [
            '.bpmn',
            '.css'
          ]
        } ],
        [ 'babelify', { global: true } ]
      ],
      debug: true
    }
  });
};
