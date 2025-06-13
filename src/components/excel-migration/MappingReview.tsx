'use client';

import React, { useState } from 'react';
import { FieldMapping, TableMapping } from '@/lib/excel-migration/field-mapper';

interface MappingReviewProps {
  tableMappings: TableMapping[];
  onAcceptMapping: (tableIndex: number, mappingIndex: number) => void;
  onRejectMapping: (tableIndex: number, mappingIndex: number) => void;
  onUpdateMapping: (tableIndex: number, mappingIndex: number, newTargetField: string) => void;
  onProceedWithMigration: () => void;
}

export function MappingReview({
  tableMappings,
  onAcceptMapping,
  onRejectMapping,
  onUpdateMapping,
  onProceedWithMigration
}: MappingReviewProps) {
  const [expandedTables, setExpandedTables] = useState<Set<number>>(new Set());
  const [editingMapping, setEditingMapping] = useState<{ tableIndex: number; mappingIndex: number } | null>(null);
  const [newTargetField, setNewTargetField] = useState('');

  const toggleTable = (index: number) => {
    const newExpanded = new Set(expandedTables);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedTables(newExpanded);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 8) return 'text-green-600';
    if (confidence >= 5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 8) return 'High';
    if (confidence >= 5) return 'Medium';
    return 'Low';
  };

  const startEditing = (tableIndex: number, mappingIndex: number, currentTarget: string) => {
    setEditingMapping({ tableIndex, mappingIndex });
    setNewTargetField(currentTarget);
  };

  const saveEdit = () => {
    if (editingMapping) {
      onUpdateMapping(editingMapping.tableIndex, editingMapping.mappingIndex, newTargetField);
      setEditingMapping(null);
      setNewTargetField('');
    }
  };

  const cancelEdit = () => {
    setEditingMapping(null);
    setNewTargetField('');
  };

  const totalMappings = tableMappings.reduce((sum, tm) => sum + tm.fieldMappings.length, 0);
  const lowConfidenceMappings = tableMappings.reduce(
    (sum, tm) => sum + tm.fieldMappings.filter(m => m.confidence < 5).length,
    0
  );

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4">Excel Migration Mapping Review</h2>
        
        <div className="mb-6 grid grid-cols-3 gap-4">
          <div className="bg-gray-50 p-4 rounded">
            <div className="text-3xl font-bold text-gray-900">{totalMappings}</div>
            <div className="text-sm text-gray-600">Total Mappings</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded">
            <div className="text-3xl font-bold text-yellow-600">{lowConfidenceMappings}</div>
            <div className="text-sm text-gray-600">Need Review</div>
          </div>
          <div className="bg-blue-50 p-4 rounded">
            <div className="text-3xl font-bold text-blue-600">{tableMappings.length}</div>
            <div className="text-sm text-gray-600">Tables</div>
          </div>
        </div>

        <div className="space-y-4">
          {tableMappings.map((tableMapping, tableIndex) => (
            <div key={tableIndex} className="border rounded-lg">
              <div
                className="p-4 bg-gray-50 cursor-pointer flex justify-between items-center"
                onClick={() => toggleTable(tableIndex)}
              >
                <div>
                  <h3 className="font-semibold text-lg">
                    {tableMapping.sourceSheet} → {tableMapping.targetTable}
                  </h3>
                  <div className="text-sm text-gray-600 mt-1">
                    Confidence: {tableMapping.confidence.toFixed(1)}/10 • 
                    {tableMapping.fieldMappings.length} fields mapped • 
                    {tableMapping.unmappedSourceFields.length} unmapped source fields
                  </div>
                </div>
                <svg
                  className={`w-5 h-5 transform transition-transform ${
                    expandedTables.has(tableIndex) ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              {expandedTables.has(tableIndex) && (
                <div className="p-4 space-y-3">
                  {tableMapping.fieldMappings.map((mapping, mappingIndex) => (
                    <div
                      key={mappingIndex}
                      className={`p-3 border rounded ${
                        mapping.confidence < 5 ? 'border-red-200 bg-red-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{mapping.sourceField}</span>
                            <span className="text-gray-500">→</span>
                            {editingMapping?.tableIndex === tableIndex && 
                             editingMapping?.mappingIndex === mappingIndex ? (
                              <input
                                type="text"
                                value={newTargetField}
                                onChange={(e) => setNewTargetField(e.target.value)}
                                className="px-2 py-1 border rounded"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveEdit();
                                  if (e.key === 'Escape') cancelEdit();
                                }}
                              />
                            ) : (
                              <span className="font-medium">{mapping.targetField}</span>
                            )}
                            <span className={`text-sm font-medium ${getConfidenceColor(mapping.confidence)}`}>
                              {mapping.confidence.toFixed(1)}/10 ({getConfidenceLabel(mapping.confidence)})
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {mapping.reasons.join(' • ')}
                          </div>
                          <div className="flex gap-4 text-xs text-gray-500 mt-1">
                            {mapping.dataTypeMatch && <span>✓ Data type match</span>}
                            {mapping.semanticMatch && <span>✓ Semantic match</span>}
                            {mapping.patternMatch && <span>✓ Pattern match</span>}
                            {mapping.businessRuleMatch && <span>✓ Business rule match</span>}
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          {editingMapping?.tableIndex === tableIndex && 
                           editingMapping?.mappingIndex === mappingIndex ? (
                            <>
                              <button
                                onClick={saveEdit}
                                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                              >
                                Save
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              {mapping.confidence < 8 && (
                                <>
                                  <button
                                    onClick={() => onAcceptMapping(tableIndex, mappingIndex)}
                                    className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                                  >
                                    Accept
                                  </button>
                                  <button
                                    onClick={() => startEditing(tableIndex, mappingIndex, mapping.targetField)}
                                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => onRejectMapping(tableIndex, mappingIndex)}
                                    className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {tableMapping.unmappedSourceFields.length > 0 && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                      <div className="font-medium text-yellow-800 mb-1">Unmapped Source Fields:</div>
                      <div className="text-sm text-yellow-700">
                        {tableMapping.unmappedSourceFields.join(', ')}
                      </div>
                    </div>
                  )}

                  {tableMapping.unmappedTargetFields.length > 0 && (
                    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded">
                      <div className="font-medium text-blue-800 mb-1">Unmapped Target Fields:</div>
                      <div className="text-sm text-blue-700">
                        {tableMapping.unmappedTargetFields.join(', ')}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end gap-4">
          <button
            onClick={onProceedWithMigration}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            disabled={lowConfidenceMappings > totalMappings * 0.5}
          >
            Proceed with Migration
          </button>
        </div>
      </div>
    </div>
  );
}