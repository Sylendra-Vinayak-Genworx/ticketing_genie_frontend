import { useMemo } from 'react';

export function useAnalyticsChartData(distribution: any) {
  return useMemo(() => {
    if (!distribution) return { statusData: [], severityData: [], priorityData: [] };

    const statusData = distribution.by_status.map((d: any) => ({
      name: d.label.replace(/_/g, ' '),
      value: d.count,
    }));
    const severityData = distribution.by_severity.map((d: any) => ({
      name: d.label,
      value: d.count,
    }));
    const priorityData = distribution.by_priority.map((d: any) => ({
      name: d.label,
      value: d.count,
    }));

    return {
      statusData,
      severityData,
      priorityData,
    };
  }, [distribution]);
}
