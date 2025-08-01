import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import ApperIcon from "@/components/ApperIcon";
import Button from "@/components/atoms/Button";
import Card from "@/components/atoms/Card";
import Input from "@/components/atoms/Input";
import Select from "@/components/atoms/Select";
import FormField from "@/components/molecules/FormField";
import Modal from "@/components/molecules/Modal";
import Loading from "@/components/ui/Loading";
import Error from "@/components/ui/Error";
import Empty from "@/components/ui/Empty";
import { customFieldService } from "@/services/api/customFieldService";

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

const CustomFieldForm = ({ field, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    name: "",
    type: "text",
    label: "",
    required: false,
    options: []
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [optionInput, setOptionInput] = useState("");

  useEffect(() => {
    if (field) {
      setFormData({
        name: field.name || "",
        type: field.type || "text",
        label: field.label || "",
        required: field.required || false,
        options: field.options || []
      });
    }
  }, [field]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }

    // Clear options when type changes away from dropdown
    if (name === "type" && value !== "dropdown") {
      setFormData(prev => ({ ...prev, options: [] }));
    }
  };

  const addOption = () => {
    if (!optionInput.trim()) return;
    
    const newOption = {
      value: optionInput.toLowerCase().replace(/\s+/g, '-'),
      label: optionInput.trim()
    };
    
    setFormData(prev => ({
      ...prev,
      options: [...prev.options, newOption]
    }));
    setOptionInput("");
  };

  const removeOption = (index) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.label.trim()) {
      newErrors.label = "Label is required";
    }

    if (!formData.name.trim()) {
      newErrors.name = "Field name is required";
    }

    if (formData.type === "dropdown" && formData.options.length === 0) {
      newErrors.options = "At least one option is required for dropdown fields";
    }

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
      
      const fieldData = {
        ...formData,
        name: formData.name.trim()
      };

      if (field) {
        await customFieldService.update(field.Id, fieldData);
      } else {
        await customFieldService.create(fieldData);
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          label="Field Label"
          name="label"
          value={formData.label}
          onChange={handleChange}
          placeholder="Enter field label"
          required
          error={errors.label}
        />

        <FormField
          label="Field Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Enter field name (used internally)"
          required
          error={errors.name}
        />

        <FormField
          type="select"
          label="Field Type"
          name="type"
          value={formData.type}
          onChange={handleChange}
          options={[
            { value: "text", name: "Text" },
            { value: "number", name: "Number" },
            { value: "dropdown", name: "Dropdown" },
            { value: "date", name: "Date" }
          ]}
          required
        />

        <div className="flex items-center">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="required"
              checked={formData.required}
              onChange={handleChange}
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span className="text-sm font-medium text-gray-700">Required field</span>
          </label>
        </div>
      </div>

      {formData.type === "dropdown" && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dropdown Options
            </label>
            <div className="flex space-x-2">
              <Input
                value={optionInput}
                onChange={(e) => setOptionInput(e.target.value)}
                placeholder="Enter option label"
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addOption();
                  }
                }}
              />
              <Button
                type="button"
                onClick={addOption}
                disabled={!optionInput.trim()}
              >
                Add
              </Button>
            </div>
            {errors.options && (
              <p className="mt-1 text-sm text-red-600">{errors.options}</p>
            )}
          </div>

          {formData.options.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Options
              </label>
              <div className="space-y-2">
                {formData.options.map((option, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <span>{option.label}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeOption(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <ApperIcon name="X" size={16} />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end space-x-4 pt-6 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="bg-gradient-to-r from-primary to-secondary text-white"
        >
          {loading ? "Saving..." : field ? "Update Field" : "Create Field"}
        </Button>
      </div>
    </form>
  );
};

export default CustomFieldManager;