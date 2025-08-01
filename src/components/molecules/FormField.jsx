import Input from "@/components/atoms/Input";
import Select from "@/components/atoms/Select";
const FormField = ({ 
  type = "input", 
  label, 
  name, 
  value, 
  onChange, 
  options = [], 
  placeholder,
  required = false,
  error,
  ...props 
}) => {
if (type === "select") {
    return (
      <Select
        label={label}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        error={error}
        {...props}
      >
        <option value="">{placeholder || "Select an option"}</option>
        {options.map((option) => (
          <option key={option.value || option.Id} value={option.value || option.name}>
            {option.label || option.name}
          </option>
        ))}
      </Select>
    );
  }

  return (
    <Input
      label={label}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      error={error}
      {...props}
    />
  );
};

export default FormField;