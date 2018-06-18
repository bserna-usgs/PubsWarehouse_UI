// Karma configuration
var istanbul = require('rollup-plugin-istanbul');

function isDebug(argument) {
    return argument === '--debug';
}


module.exports = function(config) {
    let karmaConfig = {
        // base path that will be used to resolve all patterns (eg. files, exclude)
        basePath: '../../..',


        // frameworks to use
        // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
        frameworks: ['jasmine', 'sinon'],


        // list of files / patterns to load in the browser
        files: [
            'bower_components/jquery/dist/jquery.js',
            'bower_components/bootstrap/dist/js/bootstrap.js',
            'bower_components/select2/dist/js/select2.js',
            'bower_components/handlebars/handlebars.js',
            'bower_components/leaflet/dist/leaflet.js',
            'bower_components/esri-leaflet/dist/esri-leaflet.js',
            'bower_components/moment/min/moment.min.js',
            'bower_components/eonasdan-bootstrap-datetimepicker/build/js/bootstrap-datetimepicker.min.js',
            'bower_components/underscore/underscore.js',
            'scripts/pubswh/vendor/mapbox/leaflet-pip/leaflet-pip.js',
            'tests/js/pubswh/resources/config.js',
            'scripts/pubswh/*.js',
            'tests/js/pubswh/*.js'
        ],


        // list of files to exclude
        exclude: [
            'scripts/pubswh/searchFormOnReady.js',
            'scripts/pubswh/extentsMapOnReady.js'
        ],


        // preprocess matching files before serving them to the browser
        // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
        preprocessors: {
            // source files, that you wanna generate coverage for
            // do not include tests or libraries
            // (these files will be instrumented by Istanbul)
            'scripts/**/*.js': ['rollup'],
            'tests/js/**/*.js': ['rollup']
        },

        rollupPreprocessor: {
            /**
             * This is just a normal Rollup config object,
             * except that `input` is handled for you.
             */
            ...require('../../../rollup.config')[0]
        },

        // test results reporter to use
        // possible values: 'dots', 'progress'
        // available reporters: https://npmjs.org/browse/keyword/karma-reporter
        reporters: ['dots'],

        // web server port
        port: 9876,


        // enable / disable colors in the output (reporters and logs)
        colors: true,


        // level of logging
        // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
        logLevel: config.LOG_INFO,


        // enable / disable watching file and executing tests whenever any file changes
        autoWatch: true,


        // start these browsers
        // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
        browsers: ['Firefox'],


        // Continuous Integration mode
        // if true, Karma captures browsers, runs the tests and exits
        singleRun: true,

        // Concurrency level
        // how many browser should be started simultaneous
        concurrency: Infinity
    };

    /**
     * Produce a code coverage report
     */
    if (!process.argv.some(isDebug)) {
        karmaConfig = {
            ...karmaConfig,
            rollupPreprocessor: {
                ...karmaConfig.rollupPreprocessor,
                plugins: [
                    ...karmaConfig.rollupPreprocessor.plugins,
                    istanbul({
                        exclude: [
                            'test/**/*.js',
                            'node_modules/**/*.js'
                        ]
                    })
                ]
            },
            reporters: [
                ...karmaConfig.reporters,
                'coverage'
            ],
            coverageReporter: {
                reporters: [
                    //{type: 'html', dir: 'coverage/'},
                    {type: 'cobertura', dir: 'coverage/'},
                    {type: 'lcovonly', dir: 'coverage/'}
                ]
            }
        };
    } else {
        console.log('Skipping code coverage report...');
    }

    config.set(karmaConfig);
};
