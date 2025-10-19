import SummaryCard from "../../../../component/cards/SummaryCard";
import { Database, CheckCircle, BarChart3 } from "lucide-react";

interface ReconciliationSummaryProps {
  totalRuns: number;
  completedRuns: number;
  totalVolume: number;
}

export const ReconciliationSummary: React.FC<ReconciliationSummaryProps> = ({
  totalRuns,
  completedRuns,
  totalVolume,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <SummaryCard
        title="Total Runs"
        value={totalRuns}
        color="blue"
        icon={Database}
        aria-label={`Total reconciliation runs: ${totalRuns}`}
      />
      <SummaryCard
        title="Completed"
        value={completedRuns}
        color="green"
        icon={CheckCircle}
        aria-label={`Completed reconciliation runs: ${completedRuns}`}
      />
      <SummaryCard
        title="Total Volume"
        value={Math.round(totalVolume)}
        unit=" BBL"
        color="orange"
        icon={BarChart3}
        aria-label={`Total volume processed: ${Math.round(totalVolume)} barrels`}
      />
    </div>
  );
};
