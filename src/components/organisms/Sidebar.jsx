import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import ApperIcon from "@/components/ApperIcon";

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();

const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: "BarChart3",
      path: "/",
    },
    {
      id: "leads",
      label: "Leads",
      icon: "Users",
      path: "/leads",
    },
    {
      id: "pipeline",
      label: "Pipeline",
      icon: "GitBranch",
      path: "/pipeline",
    },
    {
      id: "tasks",
      label: "Tasks",
      icon: "CheckSquare",
      path: "/tasks",
    },
  ];

  const handleNavigate = (path) => {
    navigate(path);
    if (onClose) onClose(); // Close mobile sidebar after navigation
  };

  const isActive = (path) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  // Desktop Sidebar (static)
  const DesktopSidebar = () => (
    <div className="hidden lg:flex lg:flex-col lg:w-64 lg:bg-primary lg:text-white lg:h-full">
      <div className="flex items-center px-6 py-8">
        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center mr-3">
          <ApperIcon name="Zap" size={20} className="text-primary" />
        </div>
        <h1 className="text-xl font-bold">LeadFlow CRM</h1>
      </div>
      
      <nav className="flex-1 px-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNavigate(item.path)}
            className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-all duration-200 ${
              isActive(item.path)
                ? "bg-white/20 text-white shadow-lg border-l-4 border-accent"
                : "text-white/80 hover:bg-white/10 hover:text-white"
            }`}
          >
            <ApperIcon 
              name={item.icon} 
              size={20} 
              className={`mr-3 ${isActive(item.path) ? "text-accent" : ""}`} 
            />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );

  // Mobile Sidebar (overlay with transform)
  const MobileSidebar = () => (
    <>
      {isOpen && (
        <motion.div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />
      )}
      <motion.div
        className={`lg:hidden fixed left-0 top-0 h-full w-64 bg-primary text-white z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-6 py-8">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center mr-3">
              <ApperIcon name="Zap" size={20} className="text-primary" />
            </div>
            <h1 className="text-xl font-bold">LeadFlow CRM</h1>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1"
          >
            <ApperIcon name="X" size={20} />
          </button>
        </div>
        
        <nav className="px-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavigate(item.path)}
              className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-all duration-200 ${
                isActive(item.path)
                  ? "bg-white/20 text-white shadow-lg border-l-4 border-accent"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
              }`}
            >
              <ApperIcon 
                name={item.icon} 
                size={20} 
                className={`mr-3 ${isActive(item.path) ? "text-accent" : ""}`} 
              />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
      </motion.div>
    </>
  );

  return (
    <>
      <DesktopSidebar />
      <MobileSidebar />
    </>
  );
};

export default Sidebar;