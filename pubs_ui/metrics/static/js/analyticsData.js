/* jslint browser: true */
/* global gapi */
/* global Promise */
/* global moment */
/* global CONFIG */
/* global $ */
/* global _ */

var METRICS = METRICS || {};
METRICS.analyticsData = (function() {
	"use strict";

	var DATE_FORMAT = 'YYYY-MM-DD';
	var MONTH_DIM_FORMAT = 'YYYYMM';
	var DAY_DIM_FORMAT = 'YYYYMMDD';
	var BATCH_FETCH_ENDPOINT = CONFIG.JSON_LD_ID_BASE_URL + 'metrics/gadata/';

	var self = {};

	var transformRow = function(metricNames, dateDimFormat, row) {
		var result = _.object(metricNames, row.metrics[0].values);
		result.date = moment(row.dimensions[0], dateDimFormat);
		return result;
	};

	self.fetch = function(query) {
		return new Promise(function(resolve, reject) {
			var data = new gapi.analytics.report.Data({query: query});
			data.once('success', function(response) {
				resolve(response);
			}).once('error', function(response) {
				reject(response);
			}).execute();
		});
	};

	self.fetchLast30Days = function(metrics, filters) {
		var options = {
			'ids': CONFIG.VIEW_ID,
			'start-date': '30daysAgo',
			'end-date': 'yesterday',
			'metrics': metrics,
			'dimensions': 'ga:date'
		};
		if (filters) {
			options.filters = filters;
		}
		return self.fetch(options);
	};

	self.fetchMonthlyPastYear = function(metrics, filters) {
		var dateRange = METRICS.dataUtils.getPastYear(moment());
		var options = {
			'ids': CONFIG.VIEW_ID,
			'start-date': dateRange[0].format(DATE_FORMAT),
			'end-date': dateRange[1].format(DATE_FORMAT),
			'metrics': metrics,
			'dimensions': 'ga:yearMonth'
		};
		if (filters) {
			options.filters = filters;
		}
		return self.fetch(options);
	};

	/*
	 * 	@param {Array of Metric} metrics - see https://developers.google.com/analytics/devguides/reporting/core/v4/rest/v4/reports/batchGet#metric}
	 *	@param {DimensionFilterClause} dimensionFilters - see https://developers.google.com/analytics/devguides/reporting/core/v4/rest/v4/reports/batchGet#dimensionfilterclause
	 *	@returns Jquery Promise
	 *		@resolve - successfully retrieval. Response is {Array of Array} representing the data.
	 *			First element is a moment, the rest is the data requested via the metrics parameter.
	 *		@reject - somethings went wrong - returns response. The responseJSON.error.message can be used to determine
	 *			why the request failed.
	 */
	self.batchFetchMonthlyPastYear = function(metricsAndDimFilters) {
		var dateRange = METRICS.dataUtils.getPastYear(moment());

		var transformToRequest = function(metricAndDimFilter) {
			return {
				dateRanges : [{
					startDate : dateRange[0].format(DATE_FORMAT),
					endDate : dateRange[1].format(DATE_FORMAT)
				}],
				dimensions : [{name: 'ga:yearMonth'}],
				metrics : metricAndDimFilter.metrics,
				dimensionFilterClauses : metricAndDimFilter.dimFilters
			};
		};

		var deferred = $.Deferred();
		$.ajax({
			url : BATCH_FETCH_ENDPOINT,
			method: 'POST',
			contentType : 'application/json',
			data : JSON.stringify(metricsAndDimFilters.map(transformToRequest)),
			success: function(response) {
				var transformResponse = function(report) {
					var metricNames = _.pluck(report.columnHeader.metricHeader.metricHeaderEntries, 'name');
					var transformMonthRow = _.partial(transformRow, metricNames, MONTH_DIM_FORMAT);
					var rows = _.has(report.data, 'rows') ? report.data.rows : [];

					return METRICS.dataUtils.fillMissingDates({
						startDate: dateRange[0],
						endDate: dateRange[1],
						timeUnit: 'month',
						metricNames: metricNames,
						rows: rows.map(transformMonthRow)
					});
				};

				deferred.resolve(response.reports.map(transformResponse));
			},
			error : function(jqXHR) {
				deferred.reject(jqXHR);
			},
			processData : false
		});

		return deferred;
	};

	/*
	 * 	@param {Array of Metric} metrics - see https://developers.google.com/analytics/devguides/reporting/core/v4/rest/v4/reports/batchGet#metric}
	 *	@param {DimensionFilterClause} dimensionFilters - see https://developers.google.com/analytics/devguides/reporting/core/v4/rest/v4/reports/batchGet#dimensionfilterclause
	 *	@returns Jquery Promise
	 *		@resolve - successfully retrieval. Response is {Array of Array} representing the data.
	 *			First element is a moment, the rest is the data requested via the metrics parameter.
	 *		@reject - somethings went wrong - returns response. The responseJSON.error.message can be used to determine
	 *			why the request failed.
	 */
	self.batchFetchPast30Days = function(metricsAndDimFilters) {
		var now = moment();
		var thirtyDaysAgo = now.clone().subtract(30, 'days');

		var transformToRequest = function(metricAndDimFilter) {
			return {
				dateRanges : [{
					startDate : thirtyDaysAgo.format(DATE_FORMAT),
					endDate : now.format(DATE_FORMAT)
				}],
				dimensions : [{name: 'ga:date'}],
				metrics : metricAndDimFilter.metrics,
				dimensionFilterClauses : metricAndDimFilter.dimFilters
			};
		};

		var deferred = $.Deferred();

		$.ajax({
			url : BATCH_FETCH_ENDPOINT,
			method: 'POST',
			contentType : 'application/json',
			data : JSON.stringify(metricsAndDimFilters.map(transformToRequest)),
			success: function(response) {
				var transformResponse = function(report) {
					var metricNames = _.pluck(report.columnHeader.metricHeader.metricHeaderEntries, 'name');
					var transformDayRow = _.partial(transformRow, metricNames, DAY_DIM_FORMAT);
					var rows = _.has(report.data, 'rows') ? report.data.rows : [];

					return METRICS.dataUtils.fillMissingDates({
						startDate: thirtyDaysAgo,
						endDate: now,
						timeUnit: 'day',
						metricNames: metricNames,
						rows: rows.map(transformDayRow)
					});
				};

				deferred.resolve(response.reports.map(transformResponse));
			},
			error : function(jqXHR) {
				deferred.reject(jqXHR);
			},
			processData : false
		});

		return deferred;
	};

	return self;
})();
