import React, { useState, useEffect } from 'react';
import {
  CustomCriteriaTemplate,
  CustomCriteriaField,
  CustomCriteriaConfig,
  CustomCriteriaValidationResult
} from '../../types/adminTypes';
import * as adminService from '../../services/adminService';

interface CustomCriteriaBuilderProps {
  value: CustomCriteriaConfig | null;
  onChange: (criteria: CustomCriteriaConfig | null) => void;
  season?: string;
  year?: number;
  onValidationResult?: (result: CustomCriteriaValidationResult | null) => void;
}

const CustomCriteriaBuilder: React.FC<CustomCriteriaBuilderProps> = ({
  value,
  onChange,
  season,
  year,
  onValidationResult
}) => {
  const [templates, setTemplates] = useState<CustomCriteriaTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<CustomCriteriaTemplate | null>(null);
  const [criteriaConfig, setCriteriaConfig] = useState<CustomCriteriaConfig>(value || { type: '' });
  const [validationResult, setValidationResult] = useState<CustomCriteriaValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [showJsonEditor, setShowJsonEditor] = useState(false);
  const [jsonConfig, setJsonConfig] = useState('');

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    if (value && value.type) {
      setCriteriaConfig(value);
      const template = templates.find(t => t.id === value.type);
      setSelectedTemplate(template || null);
      setJsonConfig(JSON.stringify(value, null, 2));
    }
  }, [value, templates]);

  const loadTemplates = async () => {
    try {
      const templatesData = await adminService.getCustomCriteriaTemplates();
      setTemplates(templatesData);
    } catch (error) {
      console.error('Failed to load custom criteria templates:', error);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(template);
      const newConfig = { ...template.example };
      setCriteriaConfig(newConfig);
      setJsonConfig(JSON.stringify(newConfig, null, 2));
      onChange(newConfig);
      setValidationResult(null);
    }
  };

  const handleFieldChange = (fieldKey: string, fieldValue: any) => {
    const newConfig = { ...criteriaConfig };
    
    // Handle nested object fields
    if (fieldKey.includes('.')) {
      const keys = fieldKey.split('.');
      let current = newConfig;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = fieldValue;
    } else {
      newConfig[fieldKey] = fieldValue;
    }
    
    setCriteriaConfig(newConfig);
    setJsonConfig(JSON.stringify(newConfig, null, 2));
    onChange(newConfig);
    setValidationResult(null);
  };

  const handleJsonChange = (jsonValue: string) => {
    setJsonConfig(jsonValue);
    try {
      const parsed = JSON.parse(jsonValue);
      setCriteriaConfig(parsed);
      onChange(parsed);
      setValidationResult(null);
    } catch (error) {
      // Invalid JSON, don't update the config
    }
  };
  const validateCriteria = async () => {
    if (!criteriaConfig.type || !season || !year) {
      const errorResult: CustomCriteriaValidationResult = {
        valid: false,
        error: 'Season and year are required for validation'
      };
      setValidationResult(errorResult);
      onValidationResult?.(errorResult);
      return;
    }
    
    setIsValidating(true);
    try {
      const result = await adminService.validateCustomCriteria(criteriaConfig, season, year);
      setValidationResult(result);
      onValidationResult?.(result);
    } catch (error: any) {
      const errorResult: CustomCriteriaValidationResult = {
        valid: false,
        error: error.message || 'Validation failed'
      };
      setValidationResult(errorResult);
      onValidationResult?.(errorResult);
    } finally {
      setIsValidating(false);
    }
  };

  const renderField = (field: CustomCriteriaField, parentKey = '') => {
    const fieldKey = parentKey ? `${parentKey}.${field.key}` : field.key;
    const fieldValue = parentKey 
      ? criteriaConfig[parentKey]?.[field.key] 
      : criteriaConfig[field.key];

    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            value={fieldValue || field.default || ''}
            onChange={(e) => handleFieldChange(fieldKey, e.target.value)}
            placeholder={field.placeholder}
            className="w-full p-2 border rounded"
            required={field.required}
          />
        );

      case 'number':
        return (
          <div className="flex items-center space-x-2">
            <input
              type="number"
              value={fieldValue ?? field.default ?? ''}
              onChange={(e) => handleFieldChange(fieldKey, parseFloat(e.target.value) || 0)}
              min={field.min}
              max={field.max}
              step={field.step}
              className="flex-1 p-2 border rounded"
              required={field.required}
            />
            {field.suffix && <span className="text-gray-500">{field.suffix}</span>}
          </div>
        );

      case 'select':
        return (
          <select
            value={fieldValue || field.default || ''}
            onChange={(e) => handleFieldChange(fieldKey, e.target.value)}
            className="w-full p-2 border rounded"
            required={field.required}
          >
            <option value="">Select...</option>
            {field.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'multiselect':
        return (
          <div className="space-y-2">
            {field.options?.map(option => (
              <label key={option.value} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={(fieldValue || field.default || []).includes(option.value)}
                  onChange={(e) => {
                    const currentValues = fieldValue || field.default || [];
                    if (e.target.checked) {
                      handleFieldChange(fieldKey, [...currentValues, option.value]);
                    } else {
                      handleFieldChange(fieldKey, currentValues.filter((v: string) => v !== option.value));
                    }
                  }}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        );

      case 'checkbox':
        return (
          <input
            type="checkbox"
            checked={fieldValue ?? field.default ?? false}
            onChange={(e) => handleFieldChange(fieldKey, e.target.checked)}
          />
        );

      case 'json':
        return (
          <textarea
            value={fieldValue ? JSON.stringify(fieldValue, null, 2) : ''}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                handleFieldChange(fieldKey, parsed);
              } catch (error) {
                // Invalid JSON, show the text but don't update
              }
            }}
            placeholder={field.placeholder}
            className="w-full p-2 border rounded font-mono text-sm"
            rows={6}
          />
        );

      case 'object':
        return (
          <div className="space-y-4 border rounded p-4 bg-gray-50">
            {field.fields?.map(subField => (
              <div key={subField.key}>
                <label className="block text-sm font-medium mb-1">
                  {subField.label}
                  {subField.required && <span className="text-red-500">*</span>}
                </label>
                {renderField(subField, fieldKey)}
                {subField.description && (
                  <p className="text-xs text-gray-500 mt-1">{subField.description}</p>
                )}
              </div>
            ))}
          </div>
        );

      default:
        return <span className="text-gray-500">Unsupported field type: {field.type}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Template Selection */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Criteria Template
        </label>
        <select
          value={selectedTemplate?.id || ''}
          onChange={(e) => handleTemplateSelect(e.target.value)}
          className="w-full p-2 border rounded"
        >
          <option value="">Select a template...</option>
          {templates.map(template => (
            <option key={template.id} value={template.id}>
              {template.name}
            </option>
          ))}
        </select>
        {selectedTemplate && (
          <p className="text-sm text-gray-600 mt-1">{selectedTemplate.description}</p>
        )}
      </div>

      {/* Template Fields */}
      {selectedTemplate && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Configuration</h3>
          {selectedTemplate.fields.map(field => (
            <div key={field.key}>
              <label className="block text-sm font-medium mb-1">
                {field.label}
                {field.required && <span className="text-red-500">*</span>}
              </label>
              {renderField(field)}
              {field.description && (
                <p className="text-xs text-gray-500 mt-1">{field.description}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* JSON Editor Toggle */}
      {selectedTemplate && (
        <div>
          <button
            type="button"
            onClick={() => setShowJsonEditor(!showJsonEditor)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            {showJsonEditor ? 'Hide' : 'Show'} JSON Editor
          </button>
        </div>
      )}

      {/* JSON Editor */}
      {showJsonEditor && (
        <div>
          <label className="block text-sm font-medium mb-2">
            JSON Configuration
          </label>
          <textarea
            value={jsonConfig}
            onChange={(e) => handleJsonChange(e.target.value)}
            className="w-full p-3 border rounded font-mono text-sm"
            rows={12}
            placeholder="Enter custom criteria configuration as JSON..."
          />
        </div>
      )}

      {/* Validation */}
      {selectedTemplate && (
        <div className="flex flex-col space-y-3">
          <button
            type="button"
            onClick={validateCriteria}
            disabled={isValidating || !criteriaConfig.type}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isValidating ? 'Validating...' : 'Test & Validate Criteria'}
          </button>

          {validationResult && (
            <div className={`p-4 rounded border ${
              validationResult.valid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`font-medium ${
                  validationResult.valid ? 'text-green-800' : 'text-red-800'
                }`}>
                  {validationResult.valid ? '✓ Valid' : '✗ Invalid'}
                </span>
                {validationResult.resultCount !== undefined && (
                  <span className="text-sm text-gray-600">
                    {validationResult.resultCount} potential winners
                  </span>
                )}
              </div>
              <p className={`text-sm ${
                validationResult.valid ? 'text-green-700' : 'text-red-700'
              }`}>
                {validationResult.message || validationResult.error}
              </p>
              
              {validationResult.previewResults && validationResult.previewResults.length > 0 && (
                <div className="mt-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Preview Results:</h4>
                  <div className="space-y-1">
                    {validationResult.previewResults.slice(0, 5).map((result, index) => (
                      <div key={index} className="text-xs text-gray-600">
                        User {result.userId}: {result.value.toFixed(2)} points
                      </div>
                    ))}
                    {validationResult.previewResults.length > 5 && (
                      <div className="text-xs text-gray-500">
                        ...and {validationResult.previewResults.length - 5} more
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Example */}
      {selectedTemplate && selectedTemplate.example && (
        <div className="bg-gray-50 p-4 rounded">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Example Configuration:</h4>
          <pre className="text-xs text-gray-600 overflow-x-auto">
            {JSON.stringify(selectedTemplate.example, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default CustomCriteriaBuilder;
