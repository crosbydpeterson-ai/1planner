import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const PERMISSIONS = [
  { key: "accessAI", label: "Access AI tools" },
  { key: "manageAssignments", label: "Manage assignments" },
  { key: "manageSuperAssignments", label: "Manage super assignments" },
  { key: "viewAnalytics", label: "View analytics" },
  { key: "managePets", label: "Manage pets" },
  { key: "manageThemes", label: "Manage themes" },
  { key: "manageCosmetics", label: "Manage cosmetics" },
  { key: "manageShop", label: "Manage shop" },
  { key: "manageEvents", label: "Manage events" },
  { key: "manageKitchen", label: "Manage kitchen" },
  { key: "manageLocks", label: "Manage locks" },
  { key: "banFlagUsers", label: "Ban/flag users" },
  { key: "grantAdminTokens", label: "Grant admin tokens" },
  { key: "toggleAdminRole", label: "Toggle admin role" },
  { key: "deleteAssets", label: "Delete assets" }
];

export default function RolesManager() {
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create role form
  const [roleName, setRoleName] = useState("");
  const [permDraft, setPermDraft] = useState(() => Object.fromEntries(PERMISSIONS.map(p => [p.key, false])));

  // Assignment controls
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [userPassword, setUserPassword] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [r, u] = await Promise.all([
          base44.entities.Role.list("-created_date"),
          base44.entities.UserProfile.list("-created_date")
        ]);
        setRoles(r);
        setUsers(u);
      } catch (e) {
        console.error(e);
        toast.error("Failed to load roles");
      }
      setLoading(false);
    })();
  }, []);

  const selectedRole = useMemo(() => roles.find(r => r.id === selectedRoleId) || null, [roles, selectedRoleId]);
  const assignedUsers = useMemo(() => users.filter(u => (u.assignedRoleIds || []).includes(selectedRoleId)), [users, selectedRoleId]);

  const createRole = async () => {
    if (!roleName.trim()) { toast.error("Enter role name"); return; }
    try {
      const newRole = await base44.entities.Role.create({ name: roleName.trim(), permissions: permDraft });
      setRoles([newRole, ...roles]);
      setRoleName("");
      setPermDraft(Object.fromEntries(PERMISSIONS.map(p => [p.key, false])));
      toast.success("Role created");
    } catch (e) {
      toast.error("Failed to create role");
    }
  };

  const toggleRolePerm = async (role, key, value) => {
    const updated = { ...(role.permissions || {}), [key]: value };
    try {
      await base44.entities.Role.update(role.id, { permissions: updated });
      setRoles(prev => prev.map(r => r.id === role.id ? { ...r, permissions: updated } : r));
    } catch (e) {
      toast.error("Failed to update permissions");
    }
  };

  const assignUser = async () => {
    if (!selectedRoleId || !selectedUserId) { toast.error("Select role and user"); return; }
    const user = users.find(u => u.id === selectedUserId);
    if (!user) { toast.error("User not found"); return; }
    const setIds = new Set(user.assignedRoleIds || []);
    if (setIds.has(selectedRoleId)) { toast.error("User already assigned"); return; }
    setIds.add(selectedRoleId);
    try {
      const patch = { assignedRoleIds: Array.from(setIds) };
      if (userPassword.trim()) patch.adminPanelPassword = userPassword.trim();
      const updated = await base44.entities.UserProfile.update(user.id, patch);
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, ...updated } : u));
      setSelectedUserId("");
      setUserPassword("");
      toast.success("User assigned to role");
    } catch (e) {
      toast.error("Failed to assign user");
    }
  };

  const removeUserFromRole = async (user) => {
    const setIds = new Set(user.assignedRoleIds || []);
    if (!setIds.has(selectedRoleId)) return;
    setIds.delete(selectedRoleId);
    try {
      const updated = await base44.entities.UserProfile.update(user.id, { assignedRoleIds: Array.from(setIds) });
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, ...updated } : u));
      toast.success("Removed from role");
    } catch (e) {
      toast.error("Failed to remove user");
    }
  };

  const deleteRole = async (role) => {
    // Remove role from all users first
    try {
      const affected = users.filter(u => (u.assignedRoleIds || []).includes(role.id));
      await Promise.all(affected.map(u => {
        const ids = (u.assignedRoleIds || []).filter(id => id !== role.id);
        return base44.entities.UserProfile.update(u.id, { assignedRoleIds: ids });
      }));
      setUsers(prev => prev.map(u => (u.assignedRoleIds || []).includes(role.id) ? { ...u, assignedRoleIds: (u.assignedRoleIds || []).filter(id => id !== role.id) } : u));
      await base44.entities.Role.delete(role.id);
      setRoles(prev => prev.filter(r => r.id !== role.id));
      if (selectedRoleId === role.id) setSelectedRoleId("");
      toast.success("Role deleted");
    } catch (e) {
      toast.error("Failed to delete role");
    }
  };

  if (loading) return <div className="text-slate-400">Loading...</div>;

  return (
    <div className="space-y-6">
      {/* Create role */}
      <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
        <h3 className="text-white font-semibold mb-3">Create Role</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label className="text-slate-300">Role Name</Label>
            <Input value={roleName} onChange={e => setRoleName(e.target.value)} placeholder="e.g., Assignment Manager" className="bg-slate-700 border-slate-600" />
            <Button onClick={createRole} className="mt-3 bg-indigo-600 hover:bg-indigo-700">Create</Button>
          </div>
          <div className="md:col-span-2">
            <Label className="text-slate-300">Default Permissions</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-2">
              {PERMISSIONS.map(p => (
                <div key={p.key} className="flex items-center justify-between p-2 rounded bg-slate-700/50">
                  <span className="text-slate-200 text-sm">{p.label}</span>
                  <Switch checked={!!permDraft[p.key]} onCheckedChange={v => setPermDraft(prev => ({ ...prev, [p.key]: v }))} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Roles list */}
      <div className="space-y-4">
        {roles.length === 0 ? (
          <div className="text-center text-slate-400">No roles yet</div>
        ) : roles.map(role => {
          const roleAssigned = users.filter(u => (u.assignedRoleIds || []).includes(role.id));
          return (
            <div key={role.id} className={`rounded-xl border border-slate-700 ${selectedRoleId === role.id ? 'bg-slate-800' : 'bg-slate-800/60'}`}>
              <div className="p-4 flex items-center justify-between">
                <div>
                  <h4 className="text-white font-medium">{role.name}</h4>
                  <p className="text-xs text-slate-400">{roleAssigned.length} users</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => setSelectedRoleId(selectedRoleId === role.id ? "" : role.id)} className="border-slate-600 text-slate-200">{selectedRoleId === role.id ? 'Hide' : 'Manage'}</Button>
                  <Button variant="ghost" onClick={() => deleteRole(role)} className="text-red-400 hover:text-red-300">Delete</Button>
                </div>
              </div>

              {selectedRoleId === role.id && (
                <div className="p-4 pt-0 space-y-4">
                  {/* Permissions editor */}
                  <div className="bg-slate-900/40 rounded-lg p-3">
                    <h5 className="text-slate-200 font-medium mb-2">Permissions</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {PERMISSIONS.map(p => (
                        <div key={p.key} className="flex items-center justify-between p-2 rounded bg-slate-800/60">
                          <span className="text-slate-200 text-sm">{p.label}</span>
                          <Switch checked={!!role.permissions?.[p.key]} onCheckedChange={v => toggleRolePerm(role, p.key, v)} />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Assign users */}
                  <div className="bg-slate-900/40 rounded-lg p-3">
                    <h5 className="text-slate-200 font-medium mb-2">Assign Users</h5>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <Label className="text-slate-300">User</Label>
                        <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                          <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                            <SelectValue placeholder="Select user" />
                          </SelectTrigger>
                          <SelectContent>
                            {users.map(u => (
                              <SelectItem key={u.id} value={u.id}>{u.username}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-slate-300">Admin Panel Password (optional)</Label>
                        <Input value={userPassword} onChange={e => setUserPassword(e.target.value)} placeholder="Set or update password" className="bg-slate-800 border-slate-600" />
                      </div>
                      <div className="flex items-end">
                        <Button onClick={assignUser} className="w-full bg-indigo-600 hover:bg-indigo-700">Assign</Button>
                      </div>
                    </div>

                    {roleAssigned.length > 0 ? (
                      <div className="mt-3">
                        <h6 className="text-slate-300 text-sm mb-2">Assigned</h6>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {roleAssigned.map(u => (
                            <div key={u.id} className="flex items-center justify-between p-2 rounded bg-slate-800/60">
                              <div className="text-slate-200 text-sm">{u.username} <span className="text-slate-500">({u.rank})</span></div>
                              <Button size="sm" variant="ghost" onClick={() => removeUserFromRole(u)} className="text-red-400 hover:text-red-300">Remove</Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-slate-400 text-sm mt-2">No users assigned yet</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}