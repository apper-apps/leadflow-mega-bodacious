import React, { useMemo } from "react";
import MetricCard from "@/components/molecules/MetricCard";
import Loading from "@/components/ui/Loading";
import Error from "@/components/ui/Error";

const DashboardMetrics = ({ leads, loading, error, onRetry }) => {
const metrics = useMemo(() => {
    if (!leads || leads.length === 0) {
      return {
        totalLeads: 0,
        conversionRate: 0,
        pipelineValue: 0,
        wonDeals: 0,
        qualifiedLeads: 0,
        revenueForcast: 0,
        averageDealSize: 0,
      };
    }

    const totalLeads = leads.length;
    const wonLeads = leads.filter(lead => lead.status === "Won");
    const activeLeads = leads.filter(lead => 
      !["Won", "Lost"].includes(lead.status)
    );
    const qualifiedLeads = leads.filter(lead => 
      ["Qualified", "Proposal", "Won"].includes(lead.status)
    );
    const conversionRate = totalLeads > 0 ? (wonLeads.length / totalLeads) * 100 : 0;
    const pipelineValue = leads.reduce((sum, lead) => sum + lead.value, 0);
    
    // Calculate revenue forecast based on win probability
    const revenueForcast = activeLeads.reduce((sum, lead) => {
      return sum + (lead.value * (lead.winProbability / 100));
    }, 0);
    
    // Calculate average deal size from all leads
    const averageDealSize = totalLeads > 0 ? pipelineValue / totalLeads : 0;

    return {
      totalLeads,
      conversionRate: Math.round(conversionRate * 10) / 10,
      pipelineValue,
      wonDeals: wonLeads.length,
      qualifiedLeads: qualifiedLeads.length,
      revenueForcast: Math.round(revenueForcast),
      averageDealSize: Math.round(averageDealSize),
    };
  }, [leads]);

  if (loading) {
    return <Loading type="cards" />;
  }

  if (error) {
    return <Error message={error} onRetry={onRetry} />;
  }

return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
      <MetricCard
        title="Total Leads"
        value={metrics.totalLeads}
        icon="Users"
        color="primary"
        format="number"
      />
      
      <MetricCard
        title="Pipeline Value"
        value={metrics.pipelineValue}
        icon="DollarSign"
        color="success"
        format="currency"
      />
      
      <MetricCard
        title="Revenue Forecast"
        value={metrics.revenueForcast}
        icon="TrendingUp"
        color="accent"
        format="currency"
      />
      
      <MetricCard
        title="Average Deal Size"
        value={metrics.averageDealSize}
        icon="Calculator"
        color="info"
        format="currency"
      />
      
      <MetricCard
        title="Conversion Rate"
        value={metrics.conversionRate}
        icon="Percent"
        color="secondary"
        format="percentage"
      />
      
      <MetricCard
        title="Won Deals"
        value={metrics.wonDeals}
        icon="Trophy"
        color="warning"
        format="number"
      />
    </div>
  );
};

export default DashboardMetrics;