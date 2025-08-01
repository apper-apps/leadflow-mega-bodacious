import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { customFieldService } from "@/services/api/customFieldService";
import ApperIcon from "@/components/ApperIcon";
import Modal from "@/components/molecules/Modal";
import FormField from "@/components/molecules/FormField";
import Loading from "@/components/ui/Loading";
import Error from "@/components/ui/Error";
import Empty from "@/components/ui/Empty";
import Input from "@/components/atoms/Input";
import Button from "@/components/atoms/Button";
import Select from "@/components/atoms/Select";
import Card from "@/components/atoms/Card";

const CustomFieldManager = () => {
  const [customFields, setCustomFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    loadCustomFields();
  }, []);

  const loadCustomFields = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await customFieldService.getAll();
      setCustomFields(data);
    } catch (err) {
      setError("Failed to load custom fields");
      toast.error("Failed to load custom fields");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateField = () => {
    setShowCreateModal(true);
  };

  const handleEditField = (field) => {
    setEditingField(field);
    setShowEditModal(true);
  };

  const handleFieldCreated = () => {
    setShowCreateModal(false);
    loadCustomFields();
    toast.success("Custom field created successfully");
  };

  const handleFieldUpdated = () => {
    setShowEditModal(false);
    setEditingField(null);
    loadCustomFields();
    toast.success("Custom field updated successfully");
  };

  const handleDeleteField = async (fieldId) => {
    if (window.confirm("Are you sure you want to delete this custom field? This will remove the field from all existing leads.")) {
      try {
        await customFieldService.delete(fieldId);
        toast.success("Custom field deleted successfully");
        loadCustomFields();
      } catch (err) {
        toast.error("Failed to delete custom field");
      }
    }
  };

  const getFieldTypeIcon = (type) => {
    switch (type) {
      case "text":
        return "Type";
      case "number":
        return "Hash";
      case "dropdown":
        return "ChevronDown";
      case "date":
        return "Calendar";
      default:
        return "Settings";
    }
  };

  const getFieldTypeColor = (type) => {
    switch (type) {
      case "text":
        return "text-blue-600 bg-blue-100";
      case "number":
        return "text-green-600 bg-green-100";
      case "dropdown":
        return "text-purple-600 bg-purple-100";
      case "date":
        return "text-orange-600 bg-orange-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  if (loading) {
    return <Loading type="table" />;
  }

  if (error) {
    return <Error message={error} onRetry={loadCustomFields} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Custom Fields</h2>
          <p className="text-gray-600">
            Manage custom fields that can be added to lead forms.
          </p>
        </div>
        <Button
          onClick={handleCreateField}
          className="bg-gradient-to-r from-primary to-secondary text-white"
        >
          <ApperIcon name="Plus" size={16} className="mr-2" />
          Add Custom Field
        </Button>
      </div>

      {customFields.length === 0 ? (
        <Empty
          title="No custom fields"
          description="Create your first custom field to enhance your lead forms."
          icon="Settings"
          actionLabel="Add Custom Field"
          onAction={handleCreateField}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {customFields.map((field, index) => (
            <motion.div
              key={field.Id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${getFieldTypeColor(field.type)}`}>
                      <ApperIcon name={getFieldTypeIcon(field.type)} size={20} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{field.label}</h3>
                      <p className="text-sm text-gray-500 capitalize">{field.type} field</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditField(field)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <ApperIcon name="Edit2" size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteField(field.Id)}
                      className="text-gray-400 hover:text-red-600"
                    >
                      <ApperIcon name="Trash2" size={16} />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Required:</span>
                    <span className={field.required ? "text-red-600" : "text-gray-400"}>
                      {field.required ? "Yes" : "No"}
                    </span>
                  </div>
                  
                  {field.type === "dropdown" && field.options && (
                    <div>
                      <span className="text-sm text-gray-500">Options:</span>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {field.options.slice(0, 3).map((option, idx) => (
                          <span
                            key={idx}
                            className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                          >
                            {option.label}
                          </span>
                        ))}
                        {field.options.length > 3 && (
                          <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                            +{field.options.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Custom Field"
        size="lg"
      >
        <CustomFieldForm
          onSuccess={handleFieldCreated}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>

      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Custom Field"
        size="lg"
      >
        <CustomFieldForm
          field={editingField}
          onSuccess={handleFieldUpdated}
          onCancel={() => setShowEditModal(false)}
        />
      </Modal>
    </div>
  );
};

const generateFieldName = (label) => {
    return label
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 50);
  };

const CustomFieldForm = ({ field, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    label: field?.label || "",
    name: field?.name || "",
    type: field?.type || "text",
    required: field?.required || false,
    placeholder: field?.placeholder || "",
    options: field?.options || []
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [newOption, setNewOption] = useState({ label: "", value: "" });

  const fieldTypes = [
    { value: "text", label: "Text" },
    { value: "number", label: "Number" },
    { value: "dropdown", label: "Dropdown" },
    { value: "date", label: "Date" }
  ];

  const generateFieldName = (label) => {
    return label
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 50);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.label.trim()) {
      newErrors.label = "Label is required";
    }

    if (!formData.name.trim()) {
      newErrors.name = "Field name is required";
    } else if (!/^[a-z0-9_]+$/.test(formData.name)) {
      newErrors.name = "Field name can only contain lowercase letters, numbers, and underscores";
    }

    if (formData.type === "dropdown" && formData.options.length === 0) {
      newErrors.options = "At least one option is required for dropdown fields";
    }

    if (formData.type === "dropdown" && formData.options.length > 0) {
      const duplicateLabels = formData.options.filter((option, index, arr) => 
        arr.findIndex(o => o.label.toLowerCase() === option.label.toLowerCase()) !== index
      );
      if (duplicateLabels.length > 0) {
        newErrors.options = "Duplicate option labels are not allowed";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));

    if (name === "label" && !field) {
      const generatedName = generateFieldName(value);
      setFormData(prev => ({ ...prev, name: generatedName }));
    }

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleAddOption = () => {
    if (!newOption.label.trim()) return;

    const option = {
      label: newOption.label.trim(),
      value: newOption.value.trim() || newOption.label.toLowerCase().replace(/\s+/g, '_')
    };

    setFormData(prev => ({
      ...prev,
      options: [...prev.options, option]
    }));

    setNewOption({ label: "", value: "" });
  };

  const handleRemoveOption = (index) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      if (field) {
        await customFieldService.update(field.Id, formData);
      } else {
        await customFieldService.create(formData);
      }
      onSuccess();
    } catch (err) {
      toast.error(field ? "Failed to update custom field" : "Failed to create custom field");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <FormField
        label="Field Label"
        name="label"
        value={formData.label}
        onChange={handleChange}
        placeholder="Enter field label (e.g., Company Size)"
        required
        error={errors.label}
      />

      <div className="space-y-2">
        <FormField
          label="Field Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Auto-generated from label or enter custom name"
          required
          error={errors.name}
        />
        <div className="flex items-center space-x-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              if (formData.label.trim()) {
                const generatedName = generateFieldName(formData.label);
                setFormData(prev => ({ ...prev, name: generatedName }));
                if (errors.name) {
                  setErrors(prev => ({ ...prev, name: "" }));
                }
              }
            }}
            disabled={!formData.label.trim()}
            className="text-xs text-primary hover:text-primary/80"
          >
            <ApperIcon name="RefreshCw" size={12} />
            Auto-generate
          </Button>
          <span className="text-xs text-gray-500">
            Used internally for data storage
          </span>
        </div>
      </div>

      <FormField
        type="select"
        label="Field Type"
        name="type"
        value={formData.type}
        onChange={handleChange}
        options={fieldTypes}
        required
        error={errors.type}
      />

      <FormField
        label="Placeholder Text"
        name="placeholder"
        value={formData.placeholder}
        onChange={handleChange}
        placeholder="Optional placeholder text"
        error={errors.placeholder}
      />

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="required"
          name="required"
          checked={formData.required}
          onChange={handleChange}
          className="rounded border-gray-300"
        />
        <label htmlFor="required" className="text-sm font-medium text-gray-700">
          Required field
        </label>
      </div>

      {formData.type === "dropdown" && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dropdown Options
            </label>
            
            <div className="flex space-x-2 mb-4">
              <Input
                placeholder="Option label"
                value={newOption.label}
                onChange={(e) => setNewOption(prev => ({ ...prev, label: e.target.value }))}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddOption())}
              />
              <Input
                placeholder="Option value (optional)"
                value={newOption.value}
                onChange={(e) => setNewOption(prev => ({ ...prev, value: e.target.value }))}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddOption())}
              />
              <Button
                type="button"
                onClick={handleAddOption}
                disabled={!newOption.label.trim()}
                className="px-4"
              >
                <ApperIcon name="Plus" size={16} />
              </Button>
            </div>

            {formData.options.length > 0 && (
              <div className="space-y-2">
                {formData.options.map((option, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="font-medium">{option.label}</span>
                      <span className="text-sm text-gray-500 ml-2">({option.value})</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveOption(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <ApperIcon name="X" size={16} />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {errors.options && (
              <p className="text-sm text-red-600 mt-1">{errors.options}</p>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-3 pt-6 border-t">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          loading={loading}
          className="bg-gradient-to-r from-primary to-secondary text-white"
        >
          {field ? "Update Field" : "Create Field"}
        </Button>
      </div>
    </form>
  );
};

export default CustomFieldManager;