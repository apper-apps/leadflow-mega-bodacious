import Badge from "@/components/atoms/Badge";

const StatusBadge = ({ status }) => {
  const statusConfig = {
    "New": { variant: "default", text: "New" },
    "Contacted": { variant: "info", text: "Contacted" },
    "Qualified": { variant: "warning", text: "Qualified" },
    "Proposal": { variant: "secondary", text: "Proposal" },
    "Won": { variant: "success", text: "Won" },
    "Lost": { variant: "error", text: "Lost" },
  };

  const config = statusConfig[status] || statusConfig["New"];

  return (
    <Badge variant={config.variant} size="sm">
      {config.text}
    </Badge>
  );
};

export default StatusBadge;