import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import Chart from "react-apexcharts";
import Card from "@/components/atoms/Card";
import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input";
import Loading from "@/components/ui/Loading";
import Error from "@/components/ui/Error";
import ApperIcon from "@/components/ApperIcon";
import { leadService } from "@/services/api/leadService";
import { toast } from "react-toastify";

const AnalyticsSection = ({ leads, loading, error, dateRange, onDateRangeChange, onRetry }) => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState("");

  useEffect(() => {
    if (leads && leads.length > 0) {
      loadAnalytics();
    }
  }, [dateRange, leads]);

  const loadAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      setAnalyticsError("");
      const data = await leadService.getAnalytics(dateRange);
      setAnalyticsData(data);
    } catch (err) {
      setAnalyticsError("Failed to load analytics data");
      toast.error("Failed to load analytics");
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const handleDateChange = (field, value) => {
    onDateRangeChange({
      ...dateRange,
      [field]: value
    });
  };

  // Chart configurations
  const chartTheme = {
    colors: ['#4F46E5', '#7C3AED', '#EC4899', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6'],
    fontFamily: 'Inter, system-ui, sans-serif',
    foreColor: '#374151'
  };

  const leadSourcesChart = useMemo(() => {
    if (!analyticsData?.leadSources) return null;
    
    return {
      series: analyticsData.leadSources.map(item => item.leads),
      options: {
        ...chartTheme,
        chart: { type: 'donut', height: 350 },
        labels: analyticsData.leadSources.map(item => item.source),
        legend: { position: 'bottom' },
        dataLabels: { enabled: true },
        tooltip: {
          y: {
            formatter: (val, { seriesIndex }) => {
              const item = analyticsData.leadSources[seriesIndex];
              return `${val} leads ($${item.value.toLocaleString()})`;
            }
          }
        }
      }
    };
  }, [analyticsData]);

  const conversionFunnelChart = useMemo(() => {
    if (!analyticsData?.conversionFunnel) return null;
    
    return {
      series: [{
        name: 'Leads',
        data: analyticsData.conversionFunnel.map(item => item.count)
      }],
      options: {
        ...chartTheme,
        chart: { type: 'bar', height: 350 },
        xaxis: { categories: analyticsData.conversionFunnel.map(item => item.stage) },
        plotOptions: {
          bar: { horizontal: true, distributed: true }
        },
        dataLabels: { enabled: true }
      }
    };
  }, [analyticsData]);

  const pipelineVelocityChart = useMemo(() => {
    if (!analyticsData?.pipelineVelocity) return null;
    
    return {
      series: [
        {
          name: 'Avg Days to Close',
          data: analyticsData.pipelineVelocity.map(item => item.avgDays)
        },
        {
          name: 'Leads Won',
          data: analyticsData.pipelineVelocity.map(item => item.leadsWon)
        }
      ],
      options: {
        ...chartTheme,
        chart: { type: 'line', height: 350 },
        xaxis: { categories: analyticsData.pipelineVelocity.map(item => item.month) },
        yaxis: [
          { title: { text: 'Days' } },
          { opposite: true, title: { text: 'Leads' } }
        ],
        stroke: { curve: 'smooth' }
      }
    };
  }, [analyticsData]);

  const winLossChart = useMemo(() => {
    if (!analyticsData?.winLossRatio) return null;
    
    return {
      series: [analyticsData.winLossRatio.won, analyticsData.winLossRatio.lost],
      options: {
        ...chartTheme,
        chart: { type: 'pie', height: 350 },
        labels: ['Won', 'Lost'],
        colors: ['#10B981', '#EF4444'],
        tooltip: {
          y: {
            formatter: (val, { seriesIndex }) => {
              const values = [analyticsData.winLossRatio.wonValue, analyticsData.winLossRatio.lostValue];
              return `${val} deals ($${values[seriesIndex].toLocaleString()})`;
            }
          }
        }
      }
    };
  }, [analyticsData]);

  const monthlyTrendsChart = useMemo(() => {
    if (!analyticsData?.monthlyTrends) return null;
    
    return {
      series: [
        {
          name: 'New Leads',
          type: 'column',
          data: analyticsData.monthlyTrends.map(item => item.newLeads)
        },
        {
          name: 'Revenue',
          type: 'line',
          data: analyticsData.monthlyTrends.map(item => item.revenue)
        }
      ],
      options: {
        ...chartTheme,
        chart: { type: 'line', height: 350 },
        xaxis: { categories: analyticsData.monthlyTrends.map(item => item.month) },
        yaxis: [
          { title: { text: 'Leads' } },
          { opposite: true, title: { text: 'Revenue ($)' } }
        ],
        stroke: { curve: 'smooth' }
      }
    };
  }, [analyticsData]);

  const sourceROIChart = useMemo(() => {
    if (!analyticsData?.sourceROI) return null;
    
    return {
      series: [{
        name: 'ROI %',
        data: analyticsData.sourceROI.map(item => Math.round(item.roi))
      }],
      options: {
        ...chartTheme,
        chart: { type: 'bar', height: 350 },
        xaxis: { categories: analyticsData.sourceROI.map(item => item.source) },
        colors: analyticsData.sourceROI.map(item => item.roi > 0 ? '#10B981' : '#EF4444'),
        dataLabels: { enabled: true, formatter: (val) => `${val}%` }
      }
    };
  }, [analyticsData]);

  const teamPerformanceChart = useMemo(() => {
    if (!analyticsData?.teamPerformance) return null;
    
    return {
      series: [
        {
          name: 'Revenue',
          data: analyticsData.teamPerformance.map(item => item.revenue)
        },
        {
          name: 'Pipeline Value',
          data: analyticsData.teamPerformance.map(item => item.pipelineValue)
        }
      ],
      options: {
        ...chartTheme,
        chart: { type: 'bar', height: 350 },
        xaxis: { categories: analyticsData.teamPerformance.map(item => item.member) },
        plotOptions: {
          bar: { horizontal: false, columnWidth: '55%' }
        },
        dataLabels: { enabled: false },
        yaxis: { title: { text: 'Value ($)' } }
      }
    };
  }, [analyticsData]);

  const forecastChart = useMemo(() => {
    if (!analyticsData?.forecast) return null;
    
    return {
      series: [
        {
          name: 'Forecast',
          data: analyticsData.forecast.map(item => item.forecast)
        },
        {
          name: 'Best Case',
          data: analyticsData.forecast.map(item => item.bestCase)
        },
        {
          name: 'Worst Case',
          data: analyticsData.forecast.map(item => item.worstCase)
        }
      ],
      options: {
        ...chartTheme,
        chart: { type: 'area', height: 350 },
        xaxis: { categories: analyticsData.forecast.map(item => item.month) },
        fill: { opacity: 0.6 },
        stroke: { curve: 'smooth' },
        yaxis: { title: { text: 'Revenue ($)' } }
      }
    };
  }, [analyticsData]);

  if (loading || analyticsLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <ApperIcon name="BarChart3" size={24} className="text-primary" />
          <h2 className="text-2xl font-bold text-gray-900">Advanced Analytics</h2>
        </div>
        <Loading type="cards" />
      </Card>
    );
  }

  if (error || analyticsError) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <ApperIcon name="BarChart3" size={24} className="text-primary" />
          <h2 className="text-2xl font-bold text-gray-900">Advanced Analytics</h2>
        </div>
        <Error message={error || analyticsError} onRetry={onRetry} />
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <ApperIcon name="BarChart3" size={24} className="text-primary" />
            <h2 className="text-2xl font-bold text-gray-900">Advanced Analytics</h2>
          </div>
          
          {/* Date Range Filter */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">From:</label>
              <Input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => handleDateChange('startDate', e.target.value)}
                className="w-auto"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">To:</label>
              <Input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => handleDateChange('endDate', e.target.value)}
                className="w-auto"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadAnalytics}
              className="flex items-center gap-2"
            >
              <ApperIcon name="RefreshCw" size={16} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Lead Sources Performance */}
          <Card className="p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Lead Sources Performance</h3>
            {leadSourcesChart && (
              <Chart
                options={leadSourcesChart.options}
                series={leadSourcesChart.series}
                type="donut"
                height={350}
              />
            )}
          </Card>

          {/* Conversion Funnel */}
          <Card className="p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Conversion Funnel</h3>
            {conversionFunnelChart && (
              <Chart
                options={conversionFunnelChart.options}
                series={conversionFunnelChart.series}
                type="bar"
                height={350}
              />
            )}
          </Card>

          {/* Pipeline Velocity */}
          <Card className="p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Pipeline Velocity</h3>
            {pipelineVelocityChart && (
              <Chart
                options={pipelineVelocityChart.options}
                series={pipelineVelocityChart.series}
                type="line"
                height={350}
              />
            )}
          </Card>

          {/* Win/Loss Ratio */}
          <Card className="p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Win/Loss Ratio</h3>
            {winLossChart && (
              <Chart
                options={winLossChart.options}
                series={winLossChart.series}
                type="pie"
                height={350}
              />
            )}
          </Card>

          {/* Monthly Trends */}
          <Card className="p-4 lg:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Trends</h3>
            {monthlyTrendsChart && (
              <Chart
                options={monthlyTrendsChart.options}
                series={monthlyTrendsChart.series}
                type="line"
                height={350}
              />
            )}
          </Card>

          {/* Lead Source ROI Analysis */}
          <Card className="p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Lead Source ROI Analysis</h3>
            {sourceROIChart && (
              <Chart
                options={sourceROIChart.options}
                series={sourceROIChart.series}
                type="bar"
                height={350}
              />
            )}
          </Card>

          {/* Sales Performance by Team Member */}
          <Card className="p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Performance by Team</h3>
            {teamPerformanceChart && (
              <Chart
                options={teamPerformanceChart.options}
                series={teamPerformanceChart.series}
                type="bar"
                height={350}
              />
            )}
          </Card>

          {/* Revenue Forecasting */}
          <Card className="p-4 lg:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Forecasting (Next 6 Months)</h3>
            {forecastChart && (
              <Chart
                options={forecastChart.options}
                series={forecastChart.series}
                type="area"
                height={350}
              />
            )}
          </Card>
        </div>

        {/* Summary Stats */}
        {analyticsData && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Analytics Summary</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Total Sources:</span>
                <span className="ml-2 font-medium">{analyticsData.leadSources?.length || 0}</span>
              </div>
              <div>
                <span className="text-gray-600">Win Rate:</span>
                <span className="ml-2 font-medium">
                  {analyticsData.winLossRatio ? 
                    Math.round((analyticsData.winLossRatio.won / (analyticsData.winLossRatio.won + analyticsData.winLossRatio.lost)) * 100) : 0}%
                </span>
              </div>
              <div>
                <span className="text-gray-600">Best ROI Source:</span>
                <span className="ml-2 font-medium">
                  {analyticsData.sourceROI?.reduce((best, current) => 
                    current.roi > best.roi ? current : best, { source: 'N/A', roi: 0 })?.source}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Top Performer:</span>
                <span className="ml-2 font-medium">
                  {analyticsData.teamPerformance?.reduce((best, current) => 
                    current.revenue > best.revenue ? current : best, { member: 'N/A', revenue: 0 })?.member}
                </span>
              </div>
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  );
};

export default AnalyticsSection;