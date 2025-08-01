import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import PipelineBoard from "@/components/organisms/PipelineBoard";
import { leadService } from "@/services/api/leadService";

const Pipeline = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await leadService.getAll();
      setLeads(data);
    } catch (err) {
      setError("Failed to load pipeline data");
      toast.error("Failed to load pipeline");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Sales Pipeline</h1>
        <p className="text-gray-600">
          Visualize and manage your leads as they progress through your sales stages.
        </p>
      </div>

      <PipelineBoard
        leads={leads}
        loading={loading}
        error={error}
        onRetry={loadLeads}
        onLeadUpdate={loadLeads}
      />
    </div>
  );
};

export default Pipeline;