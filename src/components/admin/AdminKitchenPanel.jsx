import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Edit2, Save, X, Loader2, Coins, Eye } from 'lucide-react';
import { toast } from 'sonner';
import KitchenAIPanel from '@/components/admin/KitchenAIPanel';
import VendingMachine from '@/components/kitchen/VendingMachine';
import FoodFeedingModal from '@/components/student/FoodFeedingModal';

const RARITY_BADGE = {
  common: 'bg-slate-600 text-slate-200',
  uncommon: 'bg-green-700 text-green-100',
  rare: 'bg-blue-700 text-blue-100',
  epic: 'bg-purple-700 text-purple-100',
  legendary: 'bg-yellow-700 text-yellow-100'
};

export default function AdminKitchenPanel() {
  const [subTab, setSubTab] = useState('all_food');
  const [foodItems, setFoodItems] = useState([]);
  const [foodInventories, setFoodInventories] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null);
  const [previewProfile, setPreviewProfile] = useState(null);
  const [showFeeding, setShowFeeding] = useState(false);
  const [feedProfileId, setFeedProfileId] = useState('');

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    const [items, inventories, allUsers] = await Promise.all([
      base44.entities.FoodItem.list('-created_date'),
      base44.entities.FoodInventory.list('-created_date', 200),
      base44.entities.UserProfile.list('-created_date')
    ]);
    setFoodItems(items);
    setFoodInventories(inventories);
    setUsers(allUsers);
    // Use first admin as preview profile for vending machine
    const admin = allUsers.find(u => u.rank === 'super_admin' || u.rank === 'admin') || allUsers[0];
    setPreviewProfile(admin);
    setLoading(false);
  };

  const handleDeleteFood = async (item) => {
    await base44.entities.FoodItem.delete(item.id);
    setFoodItems(prev => prev.filter(f => f.id !== item.id));
    toast.success(`${item.name} deleted`);
  };

  const handleToggleActive = async (item) => {
    const updated = !item.isActive;
    await base44.entities.FoodItem.update(item.id, { isActive: updated });
    setFoodItems(prev => prev.map(f => f.id === item.id ? { ...f, isActive: updated } : f));
    toast.success(updated ? 'Activated' : 'Deactivated');
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    await base44.entities.FoodItem.update(editingItem.id, {
      name: editingItem.name,
      description: editingItem.description,
      flavor: editingItem.flavor,
      rarity: editingItem.rarity,
      price: editingItem.price,
      isActive: editingItem.isActive
    });
    setFoodItems(prev => prev.map(f => f.id === editingItem.id ? { ...f, ...editingItem } : f));
    setEditingItem(null);
    toast.success('Food item updated');
  };

  if (loading) return <div className="text-center py-8 text-slate-400"><Loader2 className="w-5 h-5 animate-spin inline mr-2" />Loading kitchen data...</div>;

  const activeItems = foodItems.filter(f => f.isActive);

  return (
    <div className="space-y-4">
      <Tabs value={subTab} onValueChange={setSubTab}>
        <TabsList className="bg-slate-700/60 p-1">
          <TabsTrigger value="all_food" className="data-[state=active]:bg-slate-600">🍽️ All Food ({foodItems.length})</TabsTrigger>
          <TabsTrigger value="vending_preview" className="data-[state=active]:bg-slate-600">🎰 Vending Preview</TabsTrigger>
          <TabsTrigger value="inventories" className="data-[state=active]:bg-slate-600">🎒 Inventories</TabsTrigger>
          <TabsTrigger value="feed" className="data-[state=active]:bg-slate-600">🍴 Feed Pets</TabsTrigger>
          <TabsTrigger value="generate" className="data-[state=active]:bg-slate-600">✨ AI Generate</TabsTrigger>
        </TabsList>

        {/* ALL FOOD */}
        <TabsContent value="all_food">
          <div className="space-y-2">
            {foodItems.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No food items yet. Generate some in the AI tab!</p>
            ) : foodItems.map(item => (
              <div key={item.id} className={`flex items-center gap-3 bg-slate-800 rounded-xl p-3 border ${item.isActive ? 'border-slate-700' : 'border-red-900/40 opacity-60'}`}>
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-slate-700 flex items-center justify-center text-xl flex-shrink-0">🍽️</div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-white font-medium text-sm truncate">{item.name}</p>
                    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${RARITY_BADGE[item.rarity] || RARITY_BADGE.common}`}>{item.rarity}</span>
                    {!item.isActive && <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded">Hidden</span>}
                  </div>
                  <p className="text-slate-400 text-xs">{item.flavor} • {item.price} 🪙</p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Button size="sm" variant="ghost" onClick={() => handleToggleActive(item)} className="text-slate-400 hover:text-white h-7 px-2">
                    <Eye className="w-3 h-3" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingItem({ ...item })} className="text-slate-400 hover:text-white h-7 px-2">
                    <Edit2 className="w-3 h-3" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDeleteFood(item)} className="text-red-400 hover:text-red-300 h-7 px-2">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Inline edit */}
          {editingItem && (
            <div className="mt-4 bg-slate-700/60 rounded-xl p-4 border border-slate-600 space-y-3">
              <h4 className="text-white font-medium text-sm">Edit: {editingItem.name}</h4>
              <div className="grid grid-cols-2 gap-2">
                <Input value={editingItem.name} onChange={e => setEditingItem({ ...editingItem, name: e.target.value })} placeholder="Name" className="bg-slate-700 border-slate-600 text-white text-sm" />
                <Input value={editingItem.flavor} onChange={e => setEditingItem({ ...editingItem, flavor: e.target.value })} placeholder="Flavor" className="bg-slate-700 border-slate-600 text-white text-sm" />
              </div>
              <Input value={editingItem.description || ''} onChange={e => setEditingItem({ ...editingItem, description: e.target.value })} placeholder="Description" className="bg-slate-700 border-slate-600 text-white text-sm" />
              <div className="grid grid-cols-2 gap-2">
                <Select value={editingItem.rarity} onValueChange={v => setEditingItem({ ...editingItem, rarity: v })}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['common','uncommon','rare','epic','legendary'].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input type="number" value={editingItem.price} onChange={e => setEditingItem({ ...editingItem, price: parseInt(e.target.value) || 0 })} className="bg-slate-700 border-slate-600 text-white text-sm" />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveEdit} className="bg-green-600"><Save className="w-3 h-3 mr-1" />Save</Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingItem(null)} className="text-slate-400"><X className="w-3 h-3 mr-1" />Cancel</Button>
              </div>
            </div>
          )}
        </TabsContent>

        {/* VENDING PREVIEW */}
        <TabsContent value="vending_preview">
          <p className="text-slate-400 text-sm mb-3">This is how students see the vending machine. Only active items show.</p>
          <div className="max-w-md mx-auto">
            <VendingMachine
              foodItems={activeItems}
              profile={previewProfile || { questCoins: 9999 }}
              onPurchase={async () => { toast.info('Preview mode — no purchase made'); return false; }}
            />
          </div>
        </TabsContent>

        {/* INVENTORIES */}
        <TabsContent value="inventories">
          <p className="text-slate-400 text-sm mb-3">Food owned by students.</p>
          {foodInventories.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No one has bought food yet.</p>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {foodInventories.map(inv => {
                const owner = users.find(u => u.id === inv.userProfileId);
                return (
                  <div key={inv.id} className="flex items-center gap-3 bg-slate-800 rounded-lg p-2.5 border border-slate-700">
                    {inv.foodImageUrl ? (
                      <img src={inv.foodImageUrl} alt={inv.foodName} className="w-8 h-8 rounded object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded bg-slate-700 flex items-center justify-center text-sm">🍽️</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium">{owner?.username || 'Unknown'}</p>
                      <p className="text-slate-400 text-xs">{inv.foodName} × {inv.quantity}</p>
                    </div>
                    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${RARITY_BADGE[inv.foodRarity] || RARITY_BADGE.common}`}>{inv.foodRarity}</span>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* FEED PETS */}
        <TabsContent value="feed">
          <div className="bg-slate-800 rounded-xl p-5 border border-slate-700 space-y-4">
            <div>
              <h4 className="text-white font-semibold mb-1">Feed a Pet</h4>
              <p className="text-slate-400 text-sm">Select a student to open the feeding modal for them. Food + Pet = new Legendary pet!</p>
            </div>
            <Select value={feedProfileId} onValueChange={setFeedProfileId}>
              <SelectTrigger className="bg-slate-700 border-slate-600">
                <SelectValue placeholder="Select a student..." />
              </SelectTrigger>
              <SelectContent>
                {users.map(u => (
                  <SelectItem key={u.id} value={u.id}>{u.username} ({u.questCoins || 0} 🪙)</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              disabled={!feedProfileId}
              onClick={() => setShowFeeding(true)}
              className="w-full bg-gradient-to-r from-orange-500 to-amber-500"
            >
              🍴 Open Feeding for Selected Student
            </Button>
          </div>
        </TabsContent>

        {/* AI GENERATE */}
        <TabsContent value="generate">
          <KitchenAIPanel />
        </TabsContent>
      </Tabs>

      {showFeeding && feedProfileId && (
        <FoodFeedingModal
          profileId={feedProfileId}
          onClose={() => {
            setShowFeeding(false);
            loadAll();
          }}
        />
      )}
    </div>
  );
}