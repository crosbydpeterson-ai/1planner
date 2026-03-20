import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, ArrowLeft, Search, Users, ClipboardList, Plus, 
  Lock, Unlock, Eye, EyeOff, Key, Zap, Check, X, Edit2, Save,
  Palette, Star, Image, Trash2, Gift, Calendar, Sparkles, Wand2, Loader2, ShoppingBag, Package,
  Ban, Gavel, AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { MATH_TEACHERS, READING_TEACHERS } from '@/components/quest/TeacherConfig';
import { PETS } from '@/components/quest/PetCatalog';
import { THEMES } from '@/components/quest/ThemeCatalog';
import { toast } from 'sonner';
import AdminChatWidget from '@/components/admin/AdminChatWidget';
import CustomizationPanel from '@/components/admin/CustomizationPanel';
import PetAvatar from '@/components/quest/PetAvatar';
import CosmeticGeneratorPanel from '@/components/admin/CosmeticGeneratorPanel';
import BulkPetCreatorPanel from '@/components/admin/BulkPetCreatorPanel';
import EconomyCharts from '@/components/admin/EconomyCharts';
import AdminEmailBroadcast from '@/components/admin/AdminEmailBroadcast';
import DailyRewardsSettings from '@/components/admin/DailyRewardsSettings';
import BoothSkinManager from '@/components/admin/BoothSkinManager';
import SuperAssignmentCreator from '@/components/admin/super/SuperAssignmentCreator';
import SuperAssignmentsAnalytics from '@/components/admin/super/SuperAssignmentsAnalytics';
import PetEditorDialog from '@/components/pets/PetEditorDialog';
import RolesManager from '@/components/admin/RolesManager';
import SeasonFormDialog from '@/components/admin/SeasonFormDialog';
        <SeasonFormDialog
          open={showSeasonForm}
          onOpenChange={setShowSeasonForm}
          seasonForm={seasonForm}
          setSeasonForm={setSeasonForm}
          onSubmit={handleCreateSeason}
          customPets={customPets}
          customThemes={customThemes}
        />

        {/* New Shop Item Dialog */}
        <Dialog open={showShopItemForm} onOpenChange={setShowShopItemForm}>
          <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Shop Item</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={shopItemForm.name}
                    onChange={(e) => setShopItemForm({ ...shopItemForm, name: e.target.value })}
                    placeholder="Winter Fox"
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Price (Quest Coins)</Label>
                  <Input
                    type="number"
                    value={shopItemForm.price}
                    onChange={(e) => setShopItemForm({ ...shopItemForm, price: parseInt(e.target.value) || 0 })}
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={shopItemForm.description}
                  onChange={(e) => setShopItemForm({ ...shopItemForm, description: e.target.value })}
                  className="bg-slate-700 border-slate-600"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Item Type</Label>
                  <Select value={shopItemForm.itemType} onValueChange={(v) => setShopItemForm({ ...shopItemForm, itemType: v })}>
                    <SelectTrigger className="bg-slate-700 border-slate-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pet">Pet</SelectItem>
                      <SelectItem value="theme">Theme</SelectItem>
                      <SelectItem value="title">Title</SelectItem>
                      <SelectItem value="xp_booster">XP Booster</SelectItem>
                      {isSuperAdmin && <SelectItem value="magic_egg">Magic Egg</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Rarity</Label>
                  <Select value={shopItemForm.rarity} onValueChange={(v) => setShopItemForm({ ...shopItemForm, rarity: v })}>
                    <SelectTrigger className="bg-slate-700 border-slate-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="common">Common</SelectItem>
                      <SelectItem value="uncommon">Uncommon</SelectItem>
                      <SelectItem value="rare">Rare</SelectItem>
                      <SelectItem value="epic">Epic</SelectItem>
                      <SelectItem value="legendary">Legendary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {shopItemForm.itemType === 'pet' && (
                <div className="space-y-2">
                  <Label>Select Pet</Label>
                  <Select
                    value={shopItemForm.itemData?.petId || ''}
                    onValueChange={(v) => setShopItemForm({ ...shopItemForm, itemData: { petId: v } })}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600">
                      <SelectValue placeholder="Select pet" />
                    </SelectTrigger>
                    <SelectContent>
                      {customPets.map(pet => (
                        <SelectItem key={pet.id} value={`custom_${pet.id}`}>
                          {pet.emoji || '🎁'} {pet.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {shopItemForm.itemType === 'theme' && (
                <div className="space-y-2">
                  <Label>Select Theme</Label>
                  <Select
                    value={shopItemForm.itemData?.themeId || ''}
                    onValueChange={(v) => setShopItemForm({ ...shopItemForm, itemData: { themeId: v } })}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600">
                      <SelectValue placeholder="Select theme" />
                    </SelectTrigger>
                    <SelectContent>
                      {customThemes.map(theme => (
                        <SelectItem key={theme.id} value={`custom_${theme.id}`}>
                          {theme.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {shopItemForm.itemType === 'title' && (
                <div className="space-y-2">
                  <Label>Title Text</Label>
                  <Input
                    value={shopItemForm.itemData?.title || ''}
                    onChange={(e) => setShopItemForm({ ...shopItemForm, itemData: { title: e.target.value } })}
                    placeholder="Epic Champion"
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
              )}
              
              {shopItemForm.itemType === 'xp_booster' && (
                <div className="space-y-2">
                  <Label>XP Boost Amount</Label>
                  <Input
                    type="number"
                    value={shopItemForm.itemData?.xpAmount || ''}
                    onChange={(e) => setShopItemForm({ ...shopItemForm, itemData: { xpAmount: parseInt(e.target.value) || 0 } })}
                    placeholder="100"
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isLimited"
                  checked={shopItemForm.isLimited}
                  onChange={(e) => setShopItemForm({ ...shopItemForm, isLimited: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="isLimited" className="cursor-pointer">Limited-Time Item</Label>
              </div>

              {shopItemForm.isLimited && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input
                      type="datetime-local"
                      value={shopItemForm.startDate}
                      onChange={(e) => setShopItemForm({ ...shopItemForm, startDate: e.target.value })}
                      className="bg-slate-700 border-slate-600"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input
                      type="datetime-local"
                      value={shopItemForm.endDate}
                      onChange={(e) => setShopItemForm({ ...shopItemForm, endDate: e.target.value })}
                      className="bg-slate-700 border-slate-600"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Stock Limit (optional)</Label>
                    <Input
                      type="number"
                      value={shopItemForm.stockLimit || ''}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || null;
                        setShopItemForm({ ...shopItemForm, stockLimit: val, stockRemaining: val });
                      }}
                      placeholder="Leave empty for unlimited"
                      className="bg-slate-700 border-slate-600"
                    />
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setShowShopItemForm(false)}>Cancel</Button>
              <Button
                onClick={async () => {
                  if (!shopItemForm.name.trim()) {
                    toast.error('Enter item name');
                    return;
                  }
                  try {
                    const newItem = await base44.entities.ShopItem.create(shopItemForm);
                    setShopItems([newItem, ...shopItems]);
                    setShowShopItemForm(false);
                    setShopItemForm({
                      name: '', description: '', itemType: 'pet', itemData: {}, price: 50, rarity: 'common',
                      isLimited: false, stockLimit: null, stockRemaining: null, startDate: '', endDate: '', isActive: true
                    });
                    toast.success('Shop item created!');
                  } catch (e) {
                    toast.error('Failed to create item');
                  }
                }}
                className="bg-purple-600"
              >
                Create Item
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Shop Item Dialog */}
        <Dialog open={!!editingShopItem} onOpenChange={() => setEditingShopItem(null)}>
          <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Shop Item</DialogTitle>
            </DialogHeader>
            {editingShopItem && (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                      value={editingShopItem.name}
                      onChange={(e) => setEditingShopItem({ ...editingShopItem, name: e.target.value })}
                      className="bg-slate-700 border-slate-600"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Price</Label>
                    <Input
                      type="number"
                      value={editingShopItem.price}
                      onChange={(e) => setEditingShopItem({ ...editingShopItem, price: parseInt(e.target.value) || 0 })}
                      className="bg-slate-700 border-slate-600"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="editIsActive"
                    checked={editingShopItem.isActive}
                    onChange={(e) => setEditingShopItem({ ...editingShopItem, isActive: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="editIsActive" className="cursor-pointer">Active</Label>
                </div>
                {editingShopItem.stockLimit !== null && (
                  <div className="space-y-2">
                    <Label>Stock Remaining</Label>
                    <Input
                      type="number"
                      value={editingShopItem.stockRemaining || 0}
                      onChange={(e) => setEditingShopItem({ ...editingShopItem, stockRemaining: parseInt(e.target.value) || 0 })}
                      className="bg-slate-700 border-slate-600"
                    />
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="ghost" onClick={() => setEditingShopItem(null)}>Cancel</Button>
              <Button
                onClick={async () => {
                  try {
                    await base44.entities.ShopItem.update(editingShopItem.id, editingShopItem);
                    setShopItems(shopItems.map(i => i.id === editingShopItem.id ? editingShopItem : i));
                    setEditingShopItem(null);
                    toast.success('Item updated');
                  } catch (e) {
                    toast.error('Failed to update');
                  }
                }}
                className="bg-purple-600"
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Manual Pack Builder Dialog */}
        <Dialog open={showManualPackForm} onOpenChange={setShowManualPackForm}>
          <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Custom Pack</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Pack Name</Label>
                  <Input
                    value={manualPackForm.name}
                    onChange={(e) => setManualPackForm({ ...manualPackForm, name: e.target.value })}
                    placeholder="Winter Crew Pack"
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Pack Image</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setManualPackForm({ ...manualPackForm, imageUrl: reader.result });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
              </div>
              
              {manualPackForm.imageUrl && (
                <div className="flex items-center gap-3">
                  <img src={manualPackForm.imageUrl} alt="Pack" className="w-20 h-20 rounded-lg object-cover" />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setManualPackForm({ ...manualPackForm, imageUrl: '' })}
                    className="text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={manualPackForm.description}
                  onChange={(e) => setManualPackForm({ ...manualPackForm, description: e.target.value })}
                  placeholder="Limited-time winter bundle with exclusive pets and themes!"
                  className="bg-slate-700 border-slate-600"
                />
              </div>

              <div className="space-y-2">
                <Label>Select Items for Pack</Label>
                <div className="bg-slate-700 rounded-lg p-4 max-h-60 overflow-y-auto space-y-2">
                  {shopItems.length === 0 ? (
                    <p className="text-slate-400 text-sm text-center py-4">Create shop items first</p>
                  ) : (
                    shopItems.map(item => (
                      <div key={item.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`pack-item-${item.id}`}
                          checked={manualPackForm.itemIds.includes(item.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setManualPackForm({
                                ...manualPackForm,
                                itemIds: [...manualPackForm.itemIds, item.id]
                              });
                            } else {
                              setManualPackForm({
                                ...manualPackForm,
                                itemIds: manualPackForm.itemIds.filter(id => id !== item.id)
                              });
                            }
                          }}
                          className="rounded"
                        />
                        <Label htmlFor={`pack-item-${item.id}`} className="cursor-pointer flex-1">
                          {item.name} ({item.itemType}) - {item.price} coins
                        </Label>
                      </div>
                    ))
                  )}
                </div>
                <p className="text-xs text-slate-400">Selected: {manualPackForm.itemIds.length} items</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Original Price</Label>
                  <Input
                    type="number"
                    value={manualPackForm.originalPrice}
                    onChange={(e) => setManualPackForm({ ...manualPackForm, originalPrice: parseInt(e.target.value) || 0 })}
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bundle Price</Label>
                  <Input
                    type="number"
                    value={manualPackForm.bundlePrice}
                    onChange={(e) => setManualPackForm({ ...manualPackForm, bundlePrice: parseInt(e.target.value) || 0 })}
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Stock Limit</Label>
                  <Input
                    type="number"
                    value={manualPackForm.stockLimit || ''}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || null;
                      setManualPackForm({ ...manualPackForm, stockLimit: val, stockRemaining: val });
                    }}
                    placeholder="10"
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="datetime-local"
                    value={manualPackForm.startDate}
                    onChange={(e) => setManualPackForm({ ...manualPackForm, startDate: e.target.value })}
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input
                    type="datetime-local"
                    value={manualPackForm.endDate}
                    onChange={(e) => setManualPackForm({ ...manualPackForm, endDate: e.target.value })}
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setShowManualPackForm(false)}>Cancel</Button>
              <Button
                onClick={async () => {
                  if (!manualPackForm.name.trim() || manualPackForm.itemIds.length === 0) {
                    toast.error('Enter pack name and select items');
                    return;
                  }
                  try {
                    const newBundle = await base44.entities.Bundle.create(manualPackForm);
                    setBundles([newBundle, ...bundles]);
                    setShowManualPackForm(false);
                    setManualPackForm({
                      name: '', description: '', imageUrl: '', itemIds: [], originalPrice: 0, bundlePrice: 0,
                      discountPercent: 20, isLimited: true, stockLimit: 10, stockRemaining: 10,
                      startDate: '', endDate: '', isActive: true
                    });
                    toast.success('Pack created!');
                  } catch (e) {
                    toast.error('Failed to create pack');
                  }
                }}
                className="bg-blue-600"
              >
                Create Pack
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* New Bundle Dialog */}
        <Dialog open={showBundleForm} onOpenChange={setShowBundleForm}>
          <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Bundle</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Bundle Name</Label>
                <Input
                  value={bundleForm.name}
                  onChange={(e) => setBundleForm({ ...bundleForm, name: e.target.value })}
                  placeholder="Winter Crew Pack"
                  className="bg-slate-700 border-slate-600"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={bundleForm.description}
                  onChange={(e) => setBundleForm({ ...bundleForm, description: e.target.value })}
                  className="bg-slate-700 border-slate-600"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Original Price</Label>
                  <Input
                    type="number"
                    value={bundleForm.originalPrice}
                    onChange={(e) => setBundleForm({ ...bundleForm, originalPrice: parseInt(e.target.value) || 0 })}
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bundle Price</Label>
                  <Input
                    type="number"
                    value={bundleForm.bundlePrice}
                    onChange={(e) => setBundleForm({ ...bundleForm, bundlePrice: parseInt(e.target.value) || 0 })}
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Discount %</Label>
                  <Input
                    type="number"
                    value={bundleForm.discountPercent}
                    onChange={(e) => setBundleForm({ ...bundleForm, discountPercent: parseInt(e.target.value) || 0 })}
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Select Items (paste Shop Item IDs, comma-separated)</Label>
                <Textarea
                  value={bundleForm.itemIds.join(', ')}
                  onChange={(e) => setBundleForm({ ...bundleForm, itemIds: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                  placeholder="item_id_1, item_id_2, item_id_3"
                  className="bg-slate-700 border-slate-600"
                />
                <p className="text-xs text-slate-400">Tip: Create shop items first, then use their IDs here</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="datetime-local"
                    value={bundleForm.startDate}
                    onChange={(e) => setBundleForm({ ...bundleForm, startDate: e.target.value })}
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input
                    type="datetime-local"
                    value={bundleForm.endDate}
                    onChange={(e) => setBundleForm({ ...bundleForm, endDate: e.target.value })}
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Stock Limit (optional)</Label>
                  <Input
                    type="number"
                    value={bundleForm.stockLimit || ''}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || null;
                      setBundleForm({ ...bundleForm, stockLimit: val, stockRemaining: val });
                    }}
                    placeholder="Leave empty for unlimited"
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setShowBundleForm(false)}>Cancel</Button>
              <Button
                onClick={async () => {
                  if (!bundleForm.name.trim() || bundleForm.itemIds.length === 0) {
                    toast.error('Enter bundle name and items');
                    return;
                  }
                  try {
                    const newBundle = await base44.entities.Bundle.create(bundleForm);
                    setBundles([newBundle, ...bundles]);
                    setShowBundleForm(false);
                    setBundleForm({
                      name: '', description: '', itemIds: [], originalPrice: 0, bundlePrice: 0, discountPercent: 20,
                      isLimited: true, stockLimit: null, stockRemaining: null, startDate: '', endDate: '', isActive: true
                    });
                    toast.success('Bundle created!');
                  } catch (e) {
                    toast.error('Failed to create bundle');
                  }
                }}
                className="bg-amber-600"
              >
                Create Bundle
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Bundle Dialog */}
        <Dialog open={!!editingBundle} onOpenChange={() => setEditingBundle(null)}>
          <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Bundle</DialogTitle>
            </DialogHeader>
            {editingBundle && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={editingBundle.name}
                    onChange={(e) => setEditingBundle({ ...editingBundle, name: e.target.value })}
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Bundle Price</Label>
                    <Input
                      type="number"
                      value={editingBundle.bundlePrice}
                      onChange={(e) => setEditingBundle({ ...editingBundle, bundlePrice: parseInt(e.target.value) || 0 })}
                      className="bg-slate-700 border-slate-600"
                    />
                  </div>
                  {editingBundle.stockLimit !== null && (
                    <div className="space-y-2">
                      <Label>Stock Remaining</Label>
                      <Input
                        type="number"
                        value={editingBundle.stockRemaining || 0}
                        onChange={(e) => setEditingBundle({ ...editingBundle, stockRemaining: parseInt(e.target.value) || 0 })}
                        className="bg-slate-700 border-slate-600"
                      />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="editBundleActive"
                    checked={editingBundle.isActive}
                    onChange={(e) => setEditingBundle({ ...editingBundle, isActive: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="editBundleActive" className="cursor-pointer">Active</Label>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="ghost" onClick={() => setEditingBundle(null)}>Cancel</Button>
              <Button
                onClick={async () => {
                  try {
                    await base44.entities.Bundle.update(editingBundle.id, editingBundle);
                    setBundles(bundles.map(b => b.id === editingBundle.id ? editingBundle : b));
                    setEditingBundle(null);
                    toast.success('Bundle updated');
                  } catch (e) {
                    toast.error('Failed to update');
                  }
                }}
                className="bg-amber-600"
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reward Link Form Dialog */}
        <Dialog open={showRewardLinkForm} onOpenChange={setShowRewardLinkForm}>
          <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Reward Link</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Link Name</Label>
                <Input
                  value={rewardLinkForm.name}
                  onChange={(e) => setRewardLinkForm({ ...rewardLinkForm, name: e.target.value })}
                  placeholder="Welcome Bonus"
                  className="bg-slate-700 border-slate-600"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Reward Type</Label>
                  <Select
                    value={rewardLinkForm.rewardType}
                    onValueChange={(v) => setRewardLinkForm({ ...rewardLinkForm, rewardType: v, rewardValue: v === 'magic_egg' ? 0 : 100, rewardData: {} })}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="xp">XP</SelectItem>
                      <SelectItem value="coins">Quest Coins</SelectItem>
                      {isSuperAdmin && <SelectItem value="magic_egg">Magic Egg</SelectItem>}
                      <SelectItem value="pet">Pet</SelectItem>
                      <SelectItem value="theme">Theme</SelectItem>
                      <SelectItem value="title">Title</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(rewardLinkForm.rewardType === 'xp' || rewardLinkForm.rewardType === 'coins') && (
                  <div className="space-y-2">
                    <Label>Amount</Label>
                    <Input
                      type="number"
                      value={rewardLinkForm.rewardValue}
                      onChange={(e) => setRewardLinkForm({ ...rewardLinkForm, rewardValue: parseInt(e.target.value) || 0 })}
                      placeholder="100"
                      className="bg-slate-700 border-slate-600"
                    />
                  </div>
                )}

                {rewardLinkForm.rewardType === 'pet' && (
                  <div className="space-y-2">
                    <Label>Select Pet</Label>
                    <Select
                      value={rewardLinkForm.rewardData?.petId || ''}
                      onValueChange={(v) => setRewardLinkForm({ ...rewardLinkForm, rewardData: { petId: v } })}
                    >
                      <SelectTrigger className="bg-slate-700 border-slate-600">
                        <SelectValue placeholder="Choose pet" />
                      </SelectTrigger>
                      <SelectContent>
                        {PETS.map(pet => (
                          <SelectItem key={pet.id} value={pet.id}>
                            {pet.emoji} {pet.name}
                          </SelectItem>
                        ))}
                        {customPets.map(pet => (
                          <SelectItem key={pet.id} value={`custom_${pet.id}`}>
                            {pet.emoji || '🎁'} {pet.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {rewardLinkForm.rewardType === 'theme' && (
                  <div className="space-y-2">
                    <Label>Select Theme</Label>
                    <Select
                      value={rewardLinkForm.rewardData?.themeId || ''}
                      onValueChange={(v) => setRewardLinkForm({ ...rewardLinkForm, rewardData: { themeId: v } })}
                    >
                      <SelectTrigger className="bg-slate-700 border-slate-600">
                        <SelectValue placeholder="Choose theme" />
                      </SelectTrigger>
                      <SelectContent>
                        {THEMES.map(theme => (
                          <SelectItem key={theme.id} value={theme.id}>
                            {theme.name}
                          </SelectItem>
                        ))}
                        {customThemes.map(theme => (
                          <SelectItem key={theme.id} value={`custom_${theme.id}`}>
                            {theme.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {rewardLinkForm.rewardType === 'title' && (
                  <div className="space-y-2">
                    <Label>Title Text</Label>
                    <Input
                      value={rewardLinkForm.rewardData?.title || ''}
                      onChange={(e) => setRewardLinkForm({ ...rewardLinkForm, rewardData: { title: e.target.value } })}
                      placeholder="VIP Member"
                      className="bg-slate-700 border-slate-600"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Max Uses (leave empty for unlimited)</Label>
                  <Input
                    type="number"
                    value={rewardLinkForm.maxUses || ''}
                    onChange={(e) => setRewardLinkForm({ ...rewardLinkForm, maxUses: parseInt(e.target.value) || null })}
                    placeholder="10"
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Expires At (optional)</Label>
                  <Input
                    type="datetime-local"
                    value={rewardLinkForm.expiresAt}
                    onChange={(e) => setRewardLinkForm({ ...rewardLinkForm, expiresAt: e.target.value })}
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setShowRewardLinkForm(false)}>Cancel</Button>
              <Button
                onClick={async () => {
                  if (!rewardLinkForm.name.trim()) {
                    toast.error('Enter link name');
                    return;
                  }
                  try {
                    const newLink = await base44.entities.RewardLink.create(rewardLinkForm);
                    setRewardLinks([newLink, ...rewardLinks]);
                    setShowRewardLinkForm(false);
                    setRewardLinkForm({
                      name: '', rewardType: 'xp', rewardValue: 100, rewardData: {},
                      maxUses: 10, usedBy: [], expiresAt: '', isActive: true
                    });
                    toast.success('Reward link created!');
                  } catch (e) {
                    toast.error('Failed to create link');
                  }
                }}
                className="bg-gradient-to-r from-pink-500 to-purple-500"
              >
                Create Link
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* New Cosmetic Dialog */}
        <Dialog open={showCosmeticForm} onOpenChange={setShowCosmeticForm}>
          <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Pet Cosmetic</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={cosmeticForm.name}
                    onChange={(e) => setCosmeticForm({ ...cosmeticForm, name: e.target.value })}
                    placeholder="Cool Sunglasses"
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cosmetic Type</Label>
                  <Select value={cosmeticForm.cosmeticType} onValueChange={(v) => setCosmeticForm({ ...cosmeticForm, cosmeticType: v })}>
                    <SelectTrigger className="bg-slate-700 border-slate-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hat">Hat</SelectItem>
                      <SelectItem value="glasses">Glasses</SelectItem>
                      <SelectItem value="accessory">Accessory</SelectItem>
                      <SelectItem value="background">Background</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={cosmeticForm.description}
                  onChange={(e) => setCosmeticForm({ ...cosmeticForm, description: e.target.value })}
                  placeholder="Stylish shades for your pet"
                  className="bg-slate-700 border-slate-600"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Price (Coins)</Label>
                  <Input
                    type="number"
                    value={cosmeticForm.price}
                    onChange={(e) => setCosmeticForm({ ...cosmeticForm, price: parseInt(e.target.value) || 0 })}
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Rarity</Label>
                  <Select value={cosmeticForm.rarity} onValueChange={(v) => setCosmeticForm({ ...cosmeticForm, rarity: v })}>
                    <SelectTrigger className="bg-slate-700 border-slate-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="common">Common</SelectItem>
                      <SelectItem value="uncommon">Uncommon</SelectItem>
                      <SelectItem value="rare">Rare</SelectItem>
                      <SelectItem value="epic">Epic</SelectItem>
                      <SelectItem value="legendary">Legendary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="cosmeticLimited"
                      checked={cosmeticForm.isLimited}
                      onChange={(e) => setCosmeticForm({ ...cosmeticForm, isLimited: e.target.checked })}
                      className="rounded"
                    />
                    <Label htmlFor="cosmeticLimited" className="cursor-pointer">Limited</Label>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Upload Image (PNG/SVG with transparent background)</Label>
                <Input
                  type="file"
                  accept="image/png,image/svg+xml"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setCosmeticForm({ ...cosmeticForm, imageUrl: reader.result });
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="bg-slate-700 border-slate-600"
                />
                {cosmeticForm.imageUrl && (
                  <div className="flex items-center gap-3 p-4 bg-slate-700 rounded-lg">
                    <img src={cosmeticForm.imageUrl} alt="Preview" className="w-16 h-16 object-contain" />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setCosmeticForm({ ...cosmeticForm, imageUrl: '' })}
                      className="text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setShowCosmeticForm(false)}>Cancel</Button>
              <Button
                onClick={async () => {
                  if (!cosmeticForm.name.trim() || !cosmeticForm.imageUrl) {
                    toast.error('Enter name and upload image');
                    return;
                  }
                  try {
                    const newCosmetic = await base44.entities.PetCosmetic.create(cosmeticForm);
                    setPetCosmetics([newCosmetic, ...petCosmetics]);
                    setShowCosmeticForm(false);
                    setCosmeticForm({
                      name: '', description: '', cosmeticType: 'hat', imageUrl: '', price: 50, rarity: 'common', isLimited: false, isActive: true
                    });
                    toast.success('Cosmetic created!');
                  } catch (e) {
                    toast.error('Failed to create cosmetic');
                  }
                }}
                className="bg-pink-600"
              >
                Create Cosmetic
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* New Theme Dialog */}
        <Dialog open={showThemeForm} onOpenChange={setShowThemeForm}>
          <DialogContent className="bg-slate-800 border-slate-700 text-white">
            <DialogHeader>
              <DialogTitle>Create Custom Theme</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={themeForm.name}
                    onChange={(e) => setThemeForm({ ...themeForm, name: e.target.value })}
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Rarity</Label>
                  <Select value={themeForm.rarity} onValueChange={(v) => setThemeForm({ ...themeForm, rarity: v })}>
                    <SelectTrigger className="bg-slate-700 border-slate-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="common">Common</SelectItem>
                      <SelectItem value="uncommon">Uncommon</SelectItem>
                      <SelectItem value="rare">Rare</SelectItem>
                      <SelectItem value="epic">Epic</SelectItem>
                      <SelectItem value="legendary">Legendary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>XP Required</Label>
                <Input
                  type="number"
                  value={themeForm.xpRequired}
                  onChange={(e) => setThemeForm({ ...themeForm, xpRequired: parseInt(e.target.value) || 0 })}
                  className="bg-slate-700 border-slate-600"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Primary Color</Label>
                  <Input
                    type="color"
                    value={themeForm.primaryColor}
                    onChange={(e) => setThemeForm({ ...themeForm, primaryColor: e.target.value })}
                    className="h-10 bg-slate-700 border-slate-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Secondary Color</Label>
                  <Input
                    type="color"
                    value={themeForm.secondaryColor}
                    onChange={(e) => setThemeForm({ ...themeForm, secondaryColor: e.target.value })}
                    className="h-10 bg-slate-700 border-slate-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Accent Color</Label>
                  <Input
                    type="color"
                    value={themeForm.accentColor}
                    onChange={(e) => setThemeForm({ ...themeForm, accentColor: e.target.value })}
                    className="h-10 bg-slate-700 border-slate-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Background Color</Label>
                  <Input
                    type="color"
                    value={themeForm.bgColor}
                    onChange={(e) => setThemeForm({ ...themeForm, bgColor: e.target.value })}
                    className="h-10 bg-slate-700 border-slate-600"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={themeForm.description}
                  onChange={(e) => setThemeForm({ ...themeForm, description: e.target.value })}
                  className="bg-slate-700 border-slate-600"
                />
              </div>
              <div className="p-4 rounded-lg" style={{ backgroundColor: themeForm.bgColor }}>
                <p className="text-sm font-medium" style={{ color: themeForm.primaryColor }}>Preview</p>
                <div className="flex gap-2 mt-2">
                  <div className="px-3 py-1 rounded" style={{ backgroundColor: themeForm.primaryColor, color: 'white' }}>Primary</div>
                  <div className="px-3 py-1 rounded" style={{ backgroundColor: themeForm.secondaryColor, color: 'white' }}>Secondary</div>
                  <div className="px-3 py-1 rounded" style={{ backgroundColor: themeForm.accentColor, color: 'white' }}>Accent</div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setShowThemeForm(false)}>Cancel</Button>
              <Button onClick={handleCreateTheme} className="bg-cyan-600">Create Theme</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}