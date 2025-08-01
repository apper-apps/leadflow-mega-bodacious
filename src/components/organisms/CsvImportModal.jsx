import React, { useState, useRef } from 'react';
import { toast } from 'react-toastify';
import Papa from 'papaparse';
import { leadService } from '@/services/api/leadService';
import Modal from '@/components/molecules/Modal';
import Button from '@/components/atoms/Button';
import Input from '@/components/atoms/Input';
import ApperIcon from '@/components/ApperIcon';
import Loading from '@/components/ui/Loading';

const CsvImportModal = ({ isOpen, onClose, onImportSuccess }) => {
  const [file, setFile] = useState(null);
  const [csvData, setCsvData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [columnMapping, setColumnMapping] = useState({});
  const [step, setStep] = useState(1); // 1: Upload, 2: Preview/Map, 3: Import
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [errors, setErrors] = useState([]);
  const fileInputRef = useRef(null);

  const leadFields = [
    { key: 'name', label: 'Name', required: true },
    { key: 'email', label: 'Email', required: true },
    { key: 'phone', label: 'Phone', required: false },
    { key: 'company', label: 'Company', required: false },
    { key: 'title', label: 'Title', required: false },
    { key: 'address', label: 'Address', required: false },
    { key: 'source', label: 'Source', required: false },
    { key: 'value', label: 'Deal Value', required: false },
    { key: 'assignedUser', label: 'Assigned User', required: false },
  ];

  const handleFileSelect = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      parseCSV(selectedFile);
    } else {
      toast.error('Please select a valid CSV file');
    }
  };

  const parseCSV = (file) => {
    Papa.parse(file, {
      complete: (results) => {
        if (results.data && results.data.length > 0) {
          const headers = results.data[0];
          const data = results.data.slice(1).filter(row => row.some(cell => cell.trim()));
          
          setHeaders(headers);
          setCsvData(data);
          
          // Auto-map columns based on header names
          const autoMapping = {};
          headers.forEach((header, index) => {
            const normalizedHeader = header.toLowerCase().trim();
            const matchedField = leadFields.find(field => 
              normalizedHeader.includes(field.key.toLowerCase()) ||
              field.label.toLowerCase().includes(normalizedHeader)
            );
            if (matchedField) {
              autoMapping[index] = matchedField.key;
            }
          });
          setColumnMapping(autoMapping);
          setStep(2);
        } else {
          toast.error('CSV file appears to be empty or invalid');
        }
      },
      header: false,
      skipEmptyLines: true,
      error: (error) => {
        toast.error('Error parsing CSV file: ' + error.message);
      }
    });
  };

  const handleColumnMapping = (columnIndex, fieldKey) => {
    setColumnMapping(prev => ({
      ...prev,
      [columnIndex]: fieldKey
    }));
  };

  const validateData = () => {
    const errors = [];
    const requiredFields = leadFields.filter(field => field.required);
    
    // Check if required fields are mapped
    const mappedFields = Object.values(columnMapping);
    for (const field of requiredFields) {
      if (!mappedFields.includes(field.key)) {
        errors.push(`Required field "${field.label}" is not mapped`);
      }
    }

    // Check data rows for required values
    csvData.forEach((row, rowIndex) => {
      requiredFields.forEach(field => {
        const columnIndex = Object.keys(columnMapping).find(
          key => columnMapping[key] === field.key
        );
        if (columnIndex && (!row[columnIndex] || !row[columnIndex].trim())) {
          errors.push(`Row ${rowIndex + 2}: Missing required field "${field.label}"`);
        }
      });

      // Validate email format if email column is mapped
      const emailColumnIndex = Object.keys(columnMapping).find(
        key => columnMapping[key] === 'email'
      );
      if (emailColumnIndex && row[emailColumnIndex]) {
        const email = row[emailColumnIndex].trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          errors.push(`Row ${rowIndex + 2}: Invalid email format "${email}"`);
        }
      }
    });

    setErrors(errors);
    return errors.length === 0;
  };

  const handleImport = async () => {
    if (!validateData()) {
      toast.error(`Found ${errors.length} validation errors. Please fix them before importing.`);
      return;
    }

    setImporting(true);
    setImportProgress(0);
    setStep(3);

    try {
      const leadsToImport = csvData.map(row => {
        const lead = {};
        Object.keys(columnMapping).forEach(columnIndex => {
          const fieldKey = columnMapping[columnIndex];
          const value = row[columnIndex]?.trim();
          
          if (value) {
            if (fieldKey === 'value') {
              // Convert value to number if it's a deal value
              const numValue = parseFloat(value.replace(/[^0-9.-]/g, ''));
              lead[fieldKey] = isNaN(numValue) ? 0 : numValue;
            } else {
              lead[fieldKey] = value;
            }
          }
        });
        
        // Set default values
        lead.status = 'New';
        lead.winProbability = 25;
        
        return lead;
      });

      const results = await leadService.bulkImport(leadsToImport, (progress) => {
        setImportProgress(progress);
      });

      toast.success(`Successfully imported ${results.successful} leads`);
      if (results.failed > 0) {
        toast.warning(`${results.failed} leads failed to import`);
      }

      onImportSuccess();
      handleClose();
    } catch (error) {
      toast.error('Import failed: ' + error.message);
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setCsvData([]);
    setHeaders([]);
    setColumnMapping({});
    setStep(1);
    setImporting(false);
    setImportProgress(0);
    setErrors([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  const renderUploadStep = () => (
    <div className="text-center py-8">
      <div className="mb-6">
        <ApperIcon name="Upload" size={48} className="mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium mb-2">Upload CSV File</h3>
        <p className="text-gray-600 mb-4">
          Select a CSV file containing your lead data. The first row should contain column headers.
        </p>
      </div>
      
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 mb-4">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          className="hidden"
          id="csv-upload"
        />
        <label htmlFor="csv-upload" className="cursor-pointer">
          <div className="flex flex-col items-center">
            <ApperIcon name="FileText" size={32} className="text-gray-400 mb-2" />
            <span className="text-sm font-medium text-gray-700">
              Click to select CSV file
            </span>
            <span className="text-xs text-gray-500 mt-1">
              or drag and drop
            </span>
          </div>
        </label>
      </div>
      
      {file && (
        <div className="text-sm text-gray-600">
          Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
        </div>
      )}
      
      <div className="mt-6 text-left">
        <h4 className="font-medium mb-2">Expected CSV Format:</h4>
        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
          <div className="font-mono">Name,Email,Phone,Company,Title</div>
          <div className="font-mono">John Doe,john@example.com,555-0123,Example Corp,CEO</div>
        </div>
      </div>
    </div>
  );

  const renderMappingStep = () => (
    <div>
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Map CSV Columns</h3>
        <p className="text-gray-600">
          Map your CSV columns to lead fields. Preview shows first 3 rows.
        </p>
      </div>

      <div className="space-y-4 mb-6">
        {headers.map((header, index) => (
          <div key={index} className="flex items-center space-x-4">
            <div className="w-32 text-sm font-medium truncate" title={header}>
              {header}
            </div>
            <div className="flex-1">
              <select
                value={columnMapping[index] || ''}
                onChange={(e) => handleColumnMapping(index, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">-- Skip Column --</option>
                {leadFields.map(field => (
                  <option key={field.key} value={field.key}>
                    {field.label} {field.required && '*'}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-48 text-sm text-gray-600 truncate">
              {csvData[0] && csvData[0][index]}
            </div>
          </div>
        ))}
      </div>

      {csvData.length > 0 && (
        <div className="mb-6">
          <h4 className="font-medium mb-2">Preview ({csvData.length} rows)</h4>
          <div className="overflow-x-auto border rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {headers.map((header, index) => (
                    <th key={index} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {csvData.slice(0, 3).map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} className="px-3 py-2 text-sm text-gray-900 max-w-32 truncate">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {errors.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h4 className="font-medium text-red-800 mb-2">Validation Errors:</h4>
          <ul className="text-sm text-red-700 space-y-1">
            {errors.slice(0, 10).map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
            {errors.length > 10 && (
              <li className="text-red-600">... and {errors.length - 10} more errors</li>
            )}
          </ul>
        </div>
      )}

      <div className="flex justify-between pt-4 border-t">
        <Button
          variant="outline"
          onClick={() => setStep(1)}
        >
          Back
        </Button>
        <Button
          onClick={handleImport}
          disabled={errors.length > 0}
          className="flex items-center space-x-2"
        >
          <ApperIcon name="Upload" size={16} />
          <span>Import {csvData.length} Leads</span>
        </Button>
      </div>
    </div>
  );

  const renderImportStep = () => (
    <div className="text-center py-8">
      <Loading className="mb-4" />
      <h3 className="text-lg font-medium mb-2">Importing Leads</h3>
      <p className="text-gray-600 mb-6">
        Please wait while we import your leads...
      </p>
      
      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
        <div 
          className="bg-primary h-2 rounded-full transition-all duration-300"
          style={{ width: `${importProgress}%` }}
        />
      </div>
      
      <div className="text-sm text-gray-600">
        {importProgress}% Complete
      </div>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={importing ? () => {} : handleClose}
      title="Import Leads from CSV"
      size="lg"
      showCloseButton={!importing}
    >
      {step === 1 && renderUploadStep()}
      {step === 2 && renderMappingStep()}
      {step === 3 && renderImportStep()}
    </Modal>
  );
};

export default CsvImportModal;