import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { Button } from "@/components/ui/button";
import { Menu, X, LogOut, Home, Plane, AlertCircle, Plus, FileText, Settings, Package, BarChart3, Users } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function Navigation() {
  const [, navigate] = useLocation();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const allMenuItems = [
    { label: "Home", icon: Home, path: "/", roles: ["user", "admin", "mcc", "cabin"] },
    { label: "Fleet Overview", icon: Plane, path: "/fleet", roles: ["user", "admin", "mcc"] },
    { label: "Defect Control", icon: AlertCircle, path: "/defect-control", roles: ["admin", "mcc"] },
    { label: "New Defect", icon: Plus, path: "/new-defect", roles: ["admin", "mcc", "cabin"] },
    { label: "Cabin Defects", icon: FileText, path: "/cabin-defects", roles: ["admin", "cabin"] },
    { label: "MEL Management", icon: Settings, path: "/mel-management", roles: ["admin", "mcc"] },
    { label: "MCC Center", icon: AlertCircle, path: "/mcc-center", roles: ["admin", "mcc"] },
    { label: "Stores & Inventory", icon: Package, path: "/stores", roles: ["admin"] },
    { label: "Reports", icon: BarChart3, path: "/reports", roles: ["admin", "mcc"] },
    { label: "User Management", icon: Users, path: "/user-management", roles: ["admin"] },
  ];

  const menuItems = allMenuItems.filter((item) => 
    !user || item.roles.includes(user.role)
  );

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleNavigate("/")}>
            <Plane className="w-6 h-6" />
            <span className="font-bold text-lg">ADCMS Pro</span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-1">
            {menuItems.map((item) => (
              <Button
                key={item.path}
                variant="ghost"
                className="text-white hover:bg-blue-700"
                onClick={() => handleNavigate(item.path)}
              >
                <item.icon className="w-4 h-4 mr-2" />
                {item.label}
              </Button>
            ))}
          </div>

          {/* User Section */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <span className="text-sm hidden sm:inline">{user.name || user.email}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-blue-700"
                  onClick={logout}
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                className="bg-white text-blue-600 hover:bg-gray-100"
                onClick={startLogin}
              >
                تسجيل الدخول
              </Button>
            )}

            {/* Mobile Menu Button */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="md:hidden text-white">
                  {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64">
                <div className="flex flex-col gap-2 mt-8">
                  {menuItems.map((item) => (
                    <Button
                      key={item.path}
                      variant="ghost"
                      className="justify-start"
                      onClick={() => handleNavigate(item.path)}
                    >
                      <item.icon className="w-4 h-4 mr-2" />
                      {item.label}
                    </Button>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
