import { useState } from "react";
import ApperIcon from "@/components/ApperIcon";
import Button from "@/components/atoms/Button";

const Header = ({ onMenuClick, title = "LeadFlow CRM" }) => {
  return (
    <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuClick}
            className="lg:hidden mr-3 text-gray-600 hover:text-gray-900"
          >
            <ApperIcon name="Menu" size={20} />
          </Button>
          
          <div className="flex items-center lg:hidden">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mr-3">
              <ApperIcon name="Zap" size={20} className="text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">{title}</h1>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
            <ApperIcon name="Bell" size={20} />
          </Button>
          <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
            <ApperIcon name="Settings" size={20} />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;