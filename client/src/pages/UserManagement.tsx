import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Edit2, Plus, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

const PERMISSIONS = [
  { id: "view_defects", label: "عرض الأعطال", category: "defects" },
  { id: "create_defects", label: "إضافة أعطال", category: "defects" },
  { id: "edit_defects", label: "تعديل الأعطال", category: "defects" },
  { id: "delete_defects", label: "حذف الأعطال", category: "defects" },
  { id: "view_mel", label: "عرض الصيانة المؤجلة", category: "mel" },
  { id: "create_mel", label: "إضافة صيانة مؤجلة", category: "mel" },
  { id: "edit_mel", label: "تعديل الصيانة المؤجلة", category: "mel" },
  { id: "delete_mel", label: "حذف الصيانة المؤجلة", category: "mel" },
  { id: "view_inventory", label: "عرض المستودع", category: "inventory" },
  { id: "create_inventory", label: "إضافة قطع", category: "inventory" },
  { id: "edit_inventory", label: "تعديل القطع", category: "inventory" },
  { id: "delete_inventory", label: "حذف القطع", category: "inventory" },
  { id: "export_reports", label: "تصدير التقارير", category: "reports" },
  { id: "manage_users", label: "إدارة المستخدمين", category: "users" },
];

const ROLES = [
  { value: "user", label: "مستخدم عادي" },
  { value: "admin", label: "مسؤول" },
  { value: "mcc", label: "مهندس الصيانة" },
  { value: "cabin", label: "طاقم المقصورة" },
  { value: "quality_auditor", label: "مراجع الجودة" },
  { value: "technician", label: "فني الصيانة" },
  { value: "supervisor", label: "المشرف" },
  { value: "surveillance", label: "المراقبة" },
];

export default function UserManagement() {
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Mock data - في الواقع ستأتي من API
  const [users, setUsers] = useState<any[]>([
    { id: 1, name: "أحمد محمد", email: "ahmed@example.com", role: "quality_auditor", status: "active" },
    { id: 2, name: "محمد علي", email: "mohammad@example.com", role: "technician", status: "active" },
    { id: 3, name: "سارة أحمد", email: "sara@example.com", role: "admin", status: "active" },
  ]);

  const handlePermissionToggle = (permissionId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId) ? prev.filter((p) => p !== permissionId) : [...prev, permissionId]
    );
  };

  const handleSavePermissions = () => {
    toast.success("تم حفظ الصلاحيات بنجاح");
    setIsOpen(false);
    setSelectedPermissions([]);
    setEditingUserId(null);
  };

  const handleEditUser = (userId: number) => {
    setEditingUserId(userId);
    setIsOpen(true);
    // في الواقع ستحمل الصلاحيات من API
    setSelectedPermissions(["view_defects", "create_defects", "export_reports"]);
  };

  const groupedPermissions = PERMISSIONS.reduce(
    (acc, perm) => {
      if (!acc[perm.category]) {
        acc[perm.category] = [];
      }
      acc[perm.category].push(perm);
      return acc;
    },
    {} as Record<string, typeof PERMISSIONS>
  );

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">إدارة المستخدمين والصلاحيات</h1>
        <p className="text-gray-600 mt-2">أدر المستخدمين وعين الصلاحيات لكل واحد</p>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>المستخدمون</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-right py-3 px-4">الاسم</th>
                  <th className="text-right py-3 px-4">البريد الإلكتروني</th>
                  <th className="text-right py-3 px-4">الدور</th>
                  <th className="text-right py-3 px-4">الحالة</th>
                  <th className="text-right py-3 px-4">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">{user.name}</td>
                    <td className="py-3 px-4">{user.email}</td>
                    <td className="py-3 px-4">
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                        {ROLES.find((r) => r.value === user.role)?.label}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm ${
                          user.status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {user.status === "active" ? "نشط" : "معطل"}
                      </span>
                    </td>
                    <td className="py-3 px-4 flex gap-2">
                      <Dialog open={isOpen && editingUserId === user.id} onOpenChange={setIsOpen}>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditUser(user.id)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>تعديل صلاحيات {user.name}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-6">
                            {Object.entries(groupedPermissions).map(([category, perms]) => (
                              <div key={category}>
                                <h3 className="font-semibold mb-3 text-right">
                                  {category === "defects"
                                    ? "الأعطال"
                                    : category === "mel"
                                    ? "الصيانة المؤجلة"
                                    : category === "inventory"
                                    ? "المستودع"
                                    : category === "reports"
                                    ? "التقارير"
                                    : "المستخدمون"}
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                  {perms.map((perm) => (
                                    <div key={perm.id} className="flex items-center gap-2">
                                      <Checkbox
                                        id={perm.id}
                                        checked={selectedPermissions.includes(perm.id)}
                                        onCheckedChange={() => handlePermissionToggle(perm.id)}
                                      />
                                      <label htmlFor={perm.id} className="text-sm cursor-pointer">
                                        {perm.label}
                                      </label>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-2 justify-end mt-6">
                            <Button variant="outline" onClick={() => setIsOpen(false)}>
                              إلغاء
                            </Button>
                            <Button onClick={handleSavePermissions}>حفظ الصلاحيات</Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button size="sm" variant="destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Permissions Reference */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>الصلاحيات المتاحة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(groupedPermissions).map(([category, perms]) => (
              <div key={category}>
                <h3 className="font-semibold mb-3">
                  {category === "defects"
                    ? "الأعطال"
                    : category === "mel"
                    ? "الصيانة المؤجلة"
                    : category === "inventory"
                    ? "المستودع"
                    : category === "reports"
                    ? "التقارير"
                    : "المستخدمون"}
                </h3>
                <ul className="space-y-2">
                  {perms.map((perm) => (
                    <li key={perm.id} className="text-sm text-gray-600">
                      • {perm.label}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
