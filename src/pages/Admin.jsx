import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, ArrowLeft, Search, Users, ClipboardList, Plus, 
  Lock, Unlock, Eye, EyeOff, Key, Zap, Check, X, Edit2, Save,
  Palette, Star, Image, Trash2, Gift, Calendar, Sparkles, Wand2, Loader2, ShoppingBag, Package,
  Ban, Gavel, AlertTriangle, ExternalLink
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
import GlobalEventManager from '@/components/admin/GlobalEventManager';
import NewThemeDialog from '@/components/admin/NewThemeDialog';
import AnnouncementManager from '@/components/admin/AnnouncementManager';
import SeasonFormDialog from '@/components/admin/SeasonFormDialog';
import RewardLinkFormDialog from '@/components/admin/RewardLinkFormDialog';

...

        <SeasonFormDialog open={showSeasonForm} onOpenChange={setShowSeasonForm} seasonForm={seasonForm} setSeasonForm={setSeasonForm} customPets={customPets} customThemes={customThemes} onCreateSeason={handleCreateSeason} />

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

        <EditShopItemDialog item={editingShopItem} onOpenChange={(v) => { if (!v) setEditingShopItem(null); }} onSaved={(updated) => { setShopItems(shopItems.map(i => i.id === updated.id ? updated : i)); setEditingShopItem(null); }} />

        <ManualPackDialog
          open={showManualPackForm}
          onOpenChange={setShowManualPackForm}
          form={manualPackForm}
          setForm={setManualPackForm}
          shopItems={shopItems}
          onCreated={(newBundle) => setBundles([newBundle, ...bundles])}
        />

        <BundleFormDialog open={showBundleForm} onOpenChange={setShowBundleForm} form={bundleForm} setForm={setBundleForm} onCreated={(b) => setBundles([b, ...bundles])} />

        <EditBundleDialog bundle={editingBundle} onOpenChange={(v) => { if (!v) setEditingBundle(null); }} onSaved={(updated) => { setBundles(bundles.map(b => b.id === updated.id ? updated : b)); setEditingBundle(null); }} />

        <RewardLinkFormDialog
          open={showRewardLinkForm}
          onOpenChange={setShowRewardLinkForm}
          form={rewardLinkForm}
          setForm={setRewardLinkForm}
          isSuperAdmin={isSuperAdmin}
          customPets={customPets}
          customThemes={customThemes}
          onCreated={(newLink) => setRewardLinks([newLink, ...rewardLinks])}
        />

        <CosmeticFormDialog
          open={showCosmeticForm}
          onOpenChange={setShowCosmeticForm}
          form={cosmeticForm}
          setForm={setCosmeticForm}
          onCreated={(newCosmetic) => setPetCosmetics([newCosmetic, ...petCosmetics])}
        />

        <NewThemeDialog open={showThemeForm} onOpenChange={setShowThemeForm} themeForm={themeForm} setThemeForm={setThemeForm} onCreateTheme={handleCreateTheme} />
      </div>
    </div>
  );
}