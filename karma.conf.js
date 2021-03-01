// configures browsers to run test against
// any of [ 'ChromeHeadless', 'Chrome', 'Firefox' ]
var browsers = (process.env.TEST_BROWSERS || 'ChromeHeadless').split(',');

module.exports = function(karma) {
  karma.set({

    frameworks: [ 'webpack', 'mocha', 'chai' ],

    files: [
      'test/*Spec.js'
    ],

    preprocessors: {
      'test/*Spec.js': [ 'webpack' ]
    },

    reporters: [ 'progress' ],

    browsers,

    singleRun: true,
    autoWatch: false,

    webpack: {
      mode: 'development',
      module: {
        rules: [
          {
            test: /(\.css|\.bpmn)$/,
            use: 'raw-loader'
          }
        ]
      }
    }
  });
};
