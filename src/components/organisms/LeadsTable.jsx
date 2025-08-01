import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import leadSources from "@/services/mockData/leadSources.json";
import { leadService } from "@/services/api/leadService";
import ApperIcon from "@/components/ApperIcon";
import SearchBar from "@/components/molecules/SearchBar";
import StatusBadge from "@/components/molecules/StatusBadge";
import Loading from "@/components/ui/Loading";
import Error from "@/components/ui/Error";
import Empty from "@/components/ui/Empty";
import Input from "@/components/atoms/Input";
import Button from "@/components/atoms/Button";
import Select from "@/components/atoms/Select";
import Card from "@/components/atoms/Card";
const LeadsTable = ({ 
  leads, 
  loading, 
  error, 
  onRetry, 
  onCreateLead, 
  onDeleteLead,
  onLeadClick,
  onBulkStatusChange,
  onBulkAssignUser,
  onBulkUpdateSource,
  onBulkDelete
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLeads, setSelectedLeads] = useState(new Set());
  const [isSelectAllChecked, setIsSelectAllChecked] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: "",
    source: "",
    assignedUser: "",
    dateFrom: "",
    dateTo: "",
    valueMin: "",
    valueMax: ""
  });
const uniqueUsers = useMemo(() => {
    const users = new Set();
    leads.forEach(lead => {
      if (lead.assignedUser) users.add(lead.assignedUser);
    });
    return Array.from(users).sort();
  }, [leads]);

  const uniqueStatuses = useMemo(() => {
    const statuses = new Set();
    leads.forEach(lead => {
      if (lead.status) statuses.add(lead.status);
    });
    return Array.from(statuses).sort();
  }, [leads]);

  const filteredAndSortedLeads = useMemo(() => {
    let filtered = leads.filter(lead => {
      // Search filter
      const searchMatch = !searchTerm || 
        lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.company.toLowerCase().includes(searchTerm.toLowerCase());

      // Status filter
      const statusMatch = !filters.status || lead.status === filters.status;

      // Source filter  
      const sourceMatch = !filters.source || lead.source === filters.source;

      // Assigned user filter
      const userMatch = !filters.assignedUser || lead.assignedUser === filters.assignedUser;

      // Date range filter
      const dateMatch = (!filters.dateFrom && !filters.dateTo) || 
        ((!filters.dateFrom || new Date(lead.createdAt) >= new Date(filters.dateFrom)) &&
         (!filters.dateTo || new Date(lead.createdAt) <= new Date(filters.dateTo)));

      // Value range filter
      const valueMatch = (!filters.valueMin && !filters.valueMax) ||
        ((!filters.valueMin || lead.value >= Number(filters.valueMin)) &&
         (!filters.valueMax || lead.value <= Number(filters.valueMax)));

      return searchMatch && statusMatch && sourceMatch && userMatch && dateMatch && valueMatch;
    });

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

if (sortConfig.key === "value" || sortConfig.key === "winProbability" || sortConfig.key === "score") {
          aValue = Number(aValue);
          bValue = Number(bValue);
        } else if (sortConfig.key === "createdAt" || sortConfig.key === "closeDate") {
          aValue = new Date(aValue);
          bValue = new Date(bValue);
        } else {
          aValue = String(aValue).toLowerCase();
          bValue = String(bValue).toLowerCase();
        }

        if (aValue < bValue) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [leads, searchTerm, sortConfig, filters]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearAllFilters = () => {
    setFilters({
      status: "",
      source: "",
      assignedUser: "",
      dateFrom: "",
      dateTo: "",
      valueMin: "",
      valueMax: ""
    });
    setSearchTerm("");
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== "") || searchTerm;

  const handleSort = (key) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === "asc" ? "desc" : "asc"
    }));
  };

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return <ApperIcon name="ArrowUpDown" size={16} className="text-gray-400" />;
    }
    return sortConfig.direction === "asc" ? 
      <ApperIcon name="ArrowUp" size={16} className="text-primary" /> :
      <ApperIcon name="ArrowDown" size={16} className="text-primary" />;
  };

  if (loading) {
    return <Loading type="table" />;
  }

  if (error) {
    return <Error message={error} onRetry={onRetry} />;
  }

// Handle selection changes
  const handleSelectLead = (leadId, isChecked) => {
    const newSelectedLeads = new Set(selectedLeads);
    if (isChecked) {
      newSelectedLeads.add(leadId);
    } else {
      newSelectedLeads.delete(leadId);
    }
    setSelectedLeads(newSelectedLeads);
    setIsSelectAllChecked(newSelectedLeads.size === filteredAndSortedLeads.length && filteredAndSortedLeads.length > 0);
    setShowBulkActions(newSelectedLeads.size > 0);
  };

  const handleSelectAll = (isChecked) => {
    if (isChecked) {
      const allIds = new Set(filteredAndSortedLeads.map(lead => lead.Id));
      setSelectedLeads(allIds);
      setShowBulkActions(true);
    } else {
      setSelectedLeads(new Set());
      setShowBulkActions(false);
    }
    setIsSelectAllChecked(isChecked);
  };

  return (
    <div className="space-y-6">
      {/* Bulk Actions Bar */}
      {showBulkActions && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-primary/10 border border-primary/20 rounded-lg p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-primary">
                {selectedLeads.size} leads selected
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedLeads(new Set());
                  setShowBulkActions(false);
                  setIsSelectAllChecked(false);
                }}
              >
                Clear Selection
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              <Select
                placeholder="Change Status"
                onChange={(value) => onBulkStatusChange?.(Array.from(selectedLeads), value)}
                className="min-w-32"
              >
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="Qualified">Qualified</option>
                <option value="Proposal">Proposal</option>
                <option value="Won">Won</option>
                <option value="Lost">Lost</option>
              </Select>
              <Select
                placeholder="Assign To"
                onChange={(value) => onBulkAssignUser?.(Array.from(selectedLeads), value)}
                className="min-w-32"
              >
                {Array.from(uniqueUsers).map(user => (
                  <option key={user} value={user}>{user}</option>
                ))}
              </Select>
              <Select
                placeholder="Update Source"
                onChange={(value) => onBulkUpdateSource?.(Array.from(selectedLeads), value)}
                className="min-w-32"
              >
                {leadSources.map(source => (
                  <option key={source.Id} value={source.name}>{source.name}</option>
                ))}
              </Select>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onBulkDelete?.(Array.from(selectedLeads))}
                className="flex items-center space-x-1"
              >
                <ApperIcon name="Trash2" size={14} />
                <span>Delete</span>
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
          <SearchBar
            onSearch={setSearchTerm}
            placeholder="Search leads by name, company, or email..."
            className="flex-1 max-w-md"
          />
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <ApperIcon name="Filter" size={16} />
              Filters
              {hasActiveFilters && (
                <span className="bg-primary text-white text-xs rounded-full px-2 py-0.5 ml-1">
                  {Object.values(filters).filter(v => v !== "").length + (searchTerm ? 1 : 0)}
                </span>
              )}
            </Button>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                onClick={clearAllFilters}
                className="text-gray-500 hover:text-gray-700"
              >
                Clear All
              </Button>
            )}
          </div>
        </div>
<Button
          onClick={onCreateLead}
          className="bg-gradient-to-r from-primary to-secondary text-white hover:from-primary/90 hover:to-secondary/90"
        >
          <ApperIcon name="Plus" size={16} className="mr-2" />
          Add Lead
        </Button>
      </div>

      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-gray-50 rounded-lg p-4 border"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Select
              label="Status"
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
            >
              <option value="">All Statuses</option>
              {uniqueStatuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </Select>

            <Select
              label="Source"
              value={filters.source}
              onChange={(e) => handleFilterChange("source", e.target.value)}
            >
              <option value="">All Sources</option>
              {leadSources.map(source => (
                <option key={source.Id} value={source.value}>{source.name}</option>
              ))}
            </Select>

            <Select
              label="Assigned User"
              value={filters.assignedUser}
              onChange={(e) => handleFilterChange("assignedUser", e.target.value)}
            >
              <option value="">All Users</option>
              {uniqueUsers.map(user => (
                <option key={user} value={user}>{user}</option>
              ))}
            </Select>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Date Range</label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="date"
                  placeholder="From"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
                />
                <Input
                  type="date"
                  placeholder="To"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange("dateTo", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Deal Value Range</label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={filters.valueMin}
                  onChange={(e) => handleFilterChange("valueMin", e.target.value)}
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={filters.valueMax}
                  onChange={(e) => handleFilterChange("valueMax", e.target.value)}
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {filteredAndSortedLeads.length === 0 ? (
        <Empty
          title="No leads found"
          description={searchTerm ? "Try adjusting your search criteria." : "Start building your pipeline by adding your first lead."}
          icon="Users"
          actionLabel="Add First Lead"
          onAction={onCreateLead}
        />
      ) : (
        <Card padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
<thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={isSelectAllChecked}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                    />
                  </th>
                  {[
                    { key: "name", label: "Name" },
                    { key: "email", label: "Email" },
                    { key: "phone", label: "Phone" },
                    { key: "company", label: "Company" },
                    { key: "status", label: "Status" },
                    { key: "source", label: "Source" },
                    { key: "assignedUser", label: "Assigned To" },
                    { key: "value", label: "Value" },
                    { key: "score", label: "Lead Score" },
                    { key: "closeDate", label: "Close Date" },
                    { key: "winProbability", label: "Win %" },
                    { key: "createdAt", label: "Created" },
                  ].map((column) => (
                    <th
                      key={column.key}
                      className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      <button
                        onClick={() => handleSort(column.key)}
                        className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                      >
                        <span>{column.label}</span>
                        {getSortIcon(column.key)}
                      </button>
                    </th>
                  ))}
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedLeads.map((lead, index) => (
<motion.tr
                    key={lead.Id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
onClick={(e) => {
                      if (e.target.type !== 'checkbox') {
                        onLeadClick(lead);
                      }
                    }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedLeads.has(lead.Id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleSelectLead(lead.Id, e.target.checked);
                        }}
                        className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{lead.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {lead.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {lead.phone}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {lead.company}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={lead.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {lead.source}
</td>
<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {lead.assignedUser || 'Unassigned'}
                    </td>
<td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ${lead.value.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div 
                          className={`
                            inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                            ${lead.score >= 70 ? 'bg-green-100 text-green-800' : 
                              lead.score >= 40 ? 'bg-yellow-100 text-yellow-800' : 
                              'bg-red-100 text-red-800'}
                          `}
                        >
                          {lead.score}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {format(new Date(lead.closeDate), "MMM dd, yyyy")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <div className="w-12 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-primary h-2 rounded-full"
                            style={{ width: `${lead.winProbability}%` }}
                          />
                        </div>
                        {lead.winProbability}%
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {format(new Date(lead.createdAt), "MMM dd, yyyy")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteLead(lead.Id)}
                        className="text-gray-400 hover:text-error"
                      >
                        <ApperIcon name="Trash2" size={16} />
                      </Button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default LeadsTable;