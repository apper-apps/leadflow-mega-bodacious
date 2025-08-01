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

const renderMappingStep = () => {
    const mappedColumns = Object.values(columnMapping).filter(Boolean).length;
    const requiredFieldsMapped = leadFields
      .filter(field => field.required)
      .every(field => Object.values(columnMapping).includes(field.key));

    return (
      <div>
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">Map CSV Columns & Preview Data</h3>
          <p className="text-gray-600">
            Map your CSV columns to lead fields and preview how your data will be imported.
          </p>
          
          {/* Import Summary */}
          <div className="mt-4 flex items-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>{csvData.length} rows to import</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${mappedColumns > 0 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              <span>{mappedColumns} columns mapped</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${requiredFieldsMapped ? 'bg-green-500' : 'bg-orange-500'}`}></div>
              <span>Required fields {requiredFieldsMapped ? 'complete' : 'incomplete'}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          {headers.map((header, index) => {
            const mappedField = columnMapping[index];
            const fieldInfo = leadFields.find(f => f.key === mappedField);
            
            return (
              <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                <div className="w-32 text-sm font-medium truncate" title={header}>
                  {header}
                </div>
                <div className="flex-1">
                  <select
                    value={columnMapping[index] || ''}
                    onChange={(e) => handleColumnMapping(index, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">-- Skip Column --</option>
                    {leadFields.map(field => (
                      <option key={field.key} value={field.key}>
                        {field.label} {field.required && '*'}
                      </option>
                    ))}
                  </select>
                  {fieldInfo && (
                    <div className="mt-1 flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        fieldInfo.required ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {fieldInfo.required ? 'Required' : 'Optional'}
                      </span>
                    </div>
                  )}
                </div>
                <div className="w-48 text-sm text-gray-600">
                  <div className="truncate font-medium">Sample:</div>
                  <div className="truncate text-gray-500">
                    {csvData[0] && csvData[0][index] ? csvData[0][index] : 'No data'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {csvData.length > 0 && (
          <div className="mb-6">
            <h4 className="font-medium mb-3 flex items-center space-x-2">
              <ApperIcon name="Eye" size={16} />
              <span>Data Preview - First 3 Rows</span>
            </h4>
            
            {/* Mapped Fields Preview */}
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h5 className="text-sm font-medium text-blue-800 mb-2">How your data will be imported:</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.entries(columnMapping).map(([columnIndex, fieldKey]) => {
                  const field = leadFields.find(f => f.key === fieldKey);
                  const sampleValue = csvData[0] && csvData[0][columnIndex];
                  
                  return (
                    <div key={columnIndex} className="text-xs">
                      <span className="font-medium text-blue-900">{field?.label}:</span>
                      <span className="ml-1 text-blue-700">
                        {sampleValue || 'No sample data'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Raw Data Table */}
            <div className="overflow-x-auto border rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {headers.map((header, index) => {
                      const mappedField = columnMapping[index];
                      const fieldInfo = leadFields.find(f => f.key === mappedField);
                      
                      return (
                        <th key={index} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          <div className="flex flex-col">
                            <span>{header}</span>
                            {mappedField && (
                              <span className={`mt-1 text-xs font-normal ${
                                fieldInfo?.required ? 'text-red-600' : 'text-blue-600'
                              }`}>
                                → {fieldInfo?.label}
                              </span>
                            )}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {csvData.slice(0, 3).map((row, rowIndex) => (
                    <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      {row.map((cell, cellIndex) => {
                        const mappedField = columnMapping[cellIndex];
                        
                        return (
                          <td key={cellIndex} className={`px-3 py-2 text-sm max-w-32 truncate ${
                            mappedField ? 'bg-blue-50 text-blue-900' : 'text-gray-900'
                          }`} title={cell}>
                            {cell || <span className="text-gray-400 italic">empty</span>}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {errors.length > 0 && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h4 className="font-medium text-red-800 mb-2 flex items-center space-x-2">
              <ApperIcon name="AlertTriangle" size={16} />
              <span>Validation Errors ({errors.length}):</span>
            </h4>
            <ul className="text-sm text-red-700 space-y-1 max-h-32 overflow-y-auto">
              {errors.slice(0, 10).map((error, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="text-red-500 mt-0.5">•</span>
                  <span>{error}</span>
                </li>
              ))}
              {errors.length > 10 && (
                <li className="text-red-600 font-medium">... and {errors.length - 10} more errors</li>
              )}
            </ul>
          </div>
        )}

        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => setStep(1)}
            className="flex items-center space-x-2"
          >
            <ApperIcon name="ArrowLeft" size={16} />
            <span>Back to Upload</span>
          </Button>
          <Button
            onClick={handleImport}
            disabled={errors.length > 0 || !requiredFieldsMapped}
            className="flex items-center space-x-2"
          >
            <ApperIcon name="Upload" size={16} />
            <span>Import {csvData.length} Leads</span>
          </Button>
        </div>
      </div>
    );
  };

const renderImportStep = () => {
    const processedLeads = Math.floor((importProgress / 100) * csvData.length);
    
    return (
      <div className="py-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Loading className="w-12 h-12" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-primary">{importProgress}%</span>
              </div>
            </div>
          </div>
          
          <h3 className="text-lg font-medium mb-2">Importing Your Leads</h3>
          <p className="text-gray-600 mb-2">
            Processing your CSV data and creating lead records...
          </p>
          <p className="text-sm text-gray-500">
            {processedLeads} of {csvData.length} leads processed
          </p>
        </div>
        
        {/* Enhanced Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progress</span>
            <span>{importProgress}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 mb-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-primary to-secondary h-3 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${importProgress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>0</span>
            <span>{csvData.length} leads</span>
          </div>
        </div>

        {/* Import Status */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${importProgress > 0 ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
              <span className={importProgress > 0 ? 'text-blue-600' : 'text-gray-500'}>
                Processing Data
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${importProgress > 25 ? 'bg-yellow-500' : 'bg-gray-300'}`}></div>
              <span className={importProgress > 25 ? 'text-yellow-600' : 'text-gray-500'}>
                Validating Records
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${importProgress > 75 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              <span className={importProgress > 75 ? 'text-green-600' : 'text-gray-500'}>
                Creating Leads
              </span>
            </div>
          </div>
        </div>

        {/* Important Notice */}
        <div className="mt-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <ApperIcon name="Info" size={16} className="text-yellow-600 mt-0.5" />
            <div className="text-sm">
              <p className="text-yellow-800 font-medium">Please don't close this window</p>
              <p className="text-yellow-700">The import process is running and will complete shortly.</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

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