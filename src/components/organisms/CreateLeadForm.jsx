import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import CustomFieldRenderer from "@/components/organisms/CustomFieldRenderer";
import { customFieldService } from "@/services/api/customFieldService";
import { leadSourceService } from "@/services/api/leadSourceService";
import { leadService } from "@/services/api/leadService";
import FormField from "@/components/molecules/FormField";
import Button from "@/components/atoms/Button";

const CreateLeadForm = ({ onSuccess, onCancel }) => {
const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    source: "",
    value: "",
  });
  const [customFieldValues, setCustomFieldValues] = useState({});
  const [sources, setSources] = useState([]);
  const [customFields, setCustomFields] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sourcesLoading, setSourcesLoading] = useState(true);
  const [customFieldsLoading, setCustomFieldsLoading] = useState(true);
  const [errors, setErrors] = useState({});

useEffect(() => {
    loadSources();
    loadCustomFields();
  }, []);

  const loadSources = async () => {
    try {
      setSourcesLoading(true);
      const data = await leadSourceService.getAll();
      setSources(data.map(source => ({
        value: source.name,
        name: source.name
      })));
    } catch (error) {
      toast.error("Failed to load lead sources");
    } finally {
      setSourcesLoading(false);
    }
  };

  const loadCustomFields = async () => {
    try {
      setCustomFieldsLoading(true);
      const data = await customFieldService.getAll();
      setCustomFields(data);
    } catch (error) {
      console.error("Failed to load custom fields:", error);
} finally {
      setCustomFieldsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleCustomFieldChange = (newValues) => {
    setCustomFieldValues(newValues);
    
    // Clear custom field errors
    const customFieldErrors = Object.keys(errors).filter(key => 
      customFields.some(field => field.name === key)
    );
    if (customFieldErrors.length > 0) {
      setErrors(prev => {
        const newErrors = { ...prev };
        customFieldErrors.forEach(key => delete newErrors[key]);
        return newErrors;
      });
    }
  };

const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone is required";
    }

    if (!formData.company.trim()) {
      newErrors.company = "Company is required";
    }

    if (!formData.source) {
      newErrors.source = "Source is required";
    }

    if (!formData.value.trim()) {
      newErrors.value = "Value is required";
    } else if (isNaN(formData.value) || Number(formData.value) < 0) {
      newErrors.value = "Value must be a positive number";
    }

    // Validate custom fields
    customFields.forEach(field => {
      if (field.required && !customFieldValues[field.name]) {
        newErrors[field.name] = `${field.label} is required`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      const leadData = {
        ...formData,
        value: Number(formData.value),
        customFields: customFieldValues
      };
      
      await leadService.create(leadData);
      toast.success("Lead created successfully!");
      onSuccess();
    } catch (err) {
      toast.error("Failed to create lead");
    } finally {
      setLoading(false);
    }
  };

return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          label="Full Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Enter lead's full name"
          required
          error={errors.name}
        />

        <FormField
          label="Email Address"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Enter email address"
          required
          error={errors.email}
        />

        <FormField
          label="Phone Number"
          name="phone"
          type="tel"
          value={formData.phone}
          onChange={handleChange}
          placeholder="Enter phone number"
          required
          error={errors.phone}
        />

        <FormField
          label="Company"
          name="company"
          value={formData.company}
          onChange={handleChange}
          placeholder="Enter company name"
          required
          error={errors.company}
        />

        <FormField
          type="select"
          label="Lead Source"
          name="source"
          value={formData.source}
          onChange={handleChange}
          options={sources}
          placeholder="Select lead source"
          required
          error={errors.source}
          disabled={sourcesLoading}
        />

        <FormField
          label="Estimated Value"
          name="value"
          type="number"
          value={formData.value}
          onChange={handleChange}
          placeholder="Enter estimated deal value"
          required
          error={errors.value}
        />
      </div>

      <CustomFieldRenderer
        customFields={customFields}
        values={customFieldValues}
        onChange={handleCustomFieldChange}
        errors={errors}
      />

      <div className="flex justify-end space-x-4 pt-6 border-t">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          loading={loading}
          className="bg-gradient-to-r from-primary to-secondary text-white hover:from-primary/90 hover:to-secondary/90"
        >
          Create Lead
        </Button>
      </div>
    </form>
  );
};

export default CreateLeadForm;