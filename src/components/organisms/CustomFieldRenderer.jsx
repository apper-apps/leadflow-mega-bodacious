import FormField from "@/components/molecules/FormField";

const CustomFieldRenderer = ({ 
  customFields, 
  values, 
  onChange, 
  errors = {} 
}) => {
  if (!customFields || customFields.length === 0) {
    return null;
  }

  const handleFieldChange = (e) => {
    const { name, value, type } = e.target;
    onChange({
      ...values,
      [name]: type === "number" ? (value ? Number(value) : "") : value
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
        Additional Information
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {customFields.map((field) => {
          const fieldProps = {
            key: field.Id,
            label: field.label,
            name: field.name,
            value: values[field.name] || "",
            onChange: handleFieldChange,
            required: field.required,
            error: errors[field.name]
          };

          switch (field.type) {
            case "text":
              return (
                <FormField
                  {...fieldProps}
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                />
              );

            case "number":
              return (
                <FormField
                  {...fieldProps}
                  type="number"
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                />
              );

            case "date":
              return (
                <FormField
                  {...fieldProps}
                  type="date"
                />
              );

            case "dropdown":
              return (
                <FormField
                  {...fieldProps}
                  type="select"
                  options={field.options || []}
                  placeholder={`Select ${field.label.toLowerCase()}`}
                />
              );

            default:
              return null;
          }
        })}
      </div>
    </div>
  );
};

export default CustomFieldRenderer;