import React from 'react';
import { Save, RotateCcw, Settings, Type, Palette, Image as ImageIcon, Layout, MousePointerClick, Sparkles, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import LockedOverlay from '@/components/common/LockedOverlay';
import {
  LAYOUT_OPTIONS,
  CARD_STYLES,
  BUTTON_STYLES,
  ANIMATION_OPTIONS,
  FONT_OPTIONS,
} from '@/lib/featureLocks';
import ThemeLibrary from './ThemeLibrary';

export default function LockPageDesigner({ lockPageConfig, setLockPageConfig, saveLockPageConfig, resetConfig, previewKey, bgUploading, handleBgUpload, savedThemes }) {
  const updateCfg = (field, value) => {
    setLockPageConfig(prev => ({ ...prev, [field]: value }));
  };

  const applyTheme = (theme) => {
    setLockPageConfig(prev => ({
      ...prev,
      backgroundColor: theme.bg,
      cardColor: theme.card,
      textColor: theme.text,
      accentColor: theme.accent,
      buttonColor: theme.btn,
      buttonTextColor: theme.btnText,
      emoji: theme.emoji || prev.emoji,
    }));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Left: Controls */}
      <div className="space-y-4">
        {/* Behavior Mode */}
        <Section icon={Settings} iconColor="text-purple-400" title="Behavior Mode">
          <div className="flex gap-2">
            <button onClick={() => updateCfg('mode', 'custom')}
              className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium border transition-all ${lockPageConfig.mode === 'custom' ? 'bg-purple-600 border-purple-500 text-white' : 'bg-slate-700/60 border-slate-600 text-slate-300'}`}>
              🎨 Custom Lock Page
            </button>
            <button onClick={() => updateCfg('mode', 'redirect')}
              className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium border transition-all ${lockPageConfig.mode === 'redirect' ? 'bg-purple-600 border-purple-500 text-white' : 'bg-slate-700/60 border-slate-600 text-slate-300'}`}>
              🔗 Redirect to URL
            </button>
          </div>
          {lockPageConfig.mode === 'redirect' && (
            <div className="mt-3">
              <Label className="text-slate-300 mb-1 block">Redirect URL</Label>
              <Input value={lockPageConfig.redirectUrl} onChange={e => updateCfg('redirectUrl', e.target.value)}
                placeholder="https://example.com" className="bg-slate-700 border-slate-600 text-white" />
            </div>
          )}
        </Section>

        {lockPageConfig.mode === 'custom' && (
          <>
            {/* Theme Library */}
            <ThemeLibrary lockPageConfig={lockPageConfig} applyTheme={applyTheme} savedThemes={savedThemes} />

            {/* Layout */}
            <Section icon={Layout} iconColor="text-cyan-400" title="Layout">
              <div className="grid grid-cols-4 gap-2">
                {LAYOUT_OPTIONS.map(opt => (
                  <button key={opt.key} onClick={() => updateCfg('layout', opt.key)}
                    className={`px-2 py-3 rounded-xl text-xs font-medium border transition-all ${lockPageConfig.layout === opt.key ? 'bg-purple-600 border-purple-500 text-white' : 'bg-slate-700/60 border-slate-600 text-slate-300'}`}>
                    <span className="text-lg block mb-1">{opt.emoji}</span>
                    {opt.label}
                  </button>
                ))}
              </div>
            </Section>

            {/* Animation */}
            <Section icon={Sparkles} iconColor="text-pink-400" title="Entrance Animation">
              <div className="grid grid-cols-3 gap-2">
                {ANIMATION_OPTIONS.map(opt => (
                  <button key={opt.key} onClick={() => updateCfg('animation', opt.key)}
                    className={`px-2 py-2.5 rounded-xl text-xs font-medium border transition-all ${lockPageConfig.animation === opt.key ? 'bg-purple-600 border-purple-500 text-white' : 'bg-slate-700/60 border-slate-600 text-slate-300'}`}>
                    <span className="text-lg block mb-0.5">{opt.emoji}</span>
                    {opt.label}
                  </button>
                ))}
              </div>
            </Section>

            {/* Font */}
            <Section icon={Type} iconColor="text-blue-400" title="Font Family">
              <select value={lockPageConfig.fontFamily} onChange={e => updateCfg('fontFamily', e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm">
                {FONT_OPTIONS.map(f => (
                  <option key={f.key} value={f.key}>{f.label}</option>
                ))}
              </select>
            </Section>

            {/* Card Style */}
            <Section icon={Palette} iconColor="text-amber-400" title="Card Style">
              <div className="grid grid-cols-1 gap-2">
                {CARD_STYLES.map(opt => (
                  <button key={opt.key} onClick={() => updateCfg('cardStyle', opt.key)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm border transition-all ${lockPageConfig.cardStyle === opt.key ? 'bg-purple-600 border-purple-500 text-white' : 'bg-slate-700/60 border-slate-600 text-slate-300'}`}>
                    <span className="font-medium">{opt.label}</span>
                    <span className="text-xs opacity-60">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </Section>

            {/* Button Style */}
            <Section icon={MousePointerClick} iconColor="text-emerald-400" title="Button Style & Redirect">
              <div className="grid grid-cols-3 gap-2 mb-3">
                {BUTTON_STYLES.map(opt => (
                  <button key={opt.key} onClick={() => updateCfg('buttonStyle', opt.key)}
                    className={`px-2 py-2 rounded-lg text-xs font-medium border transition-all ${lockPageConfig.buttonStyle === opt.key ? 'bg-purple-600 border-purple-500 text-white' : 'bg-slate-700 border-slate-600 text-slate-300'}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
              <Label className="text-slate-400 text-xs mb-1 block">Button click action:</Label>
              <div className="flex gap-2 mb-2">
                <button onClick={() => updateCfg('buttonAction', 'dashboard')}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium border ${lockPageConfig.buttonAction === 'dashboard' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-700 border-slate-600 text-slate-300'}`}>
                  ← Back to Dashboard
                </button>
                <button onClick={() => updateCfg('buttonAction', 'redirect')}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium border ${lockPageConfig.buttonAction === 'redirect' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-700 border-slate-600 text-slate-300'}`}>
                  🔗 Redirect to URL
                </button>
              </div>
              {lockPageConfig.buttonAction === 'redirect' && (
                <Input value={lockPageConfig.buttonRedirectUrl} onChange={e => updateCfg('buttonRedirectUrl', e.target.value)}
                  placeholder="https://forms.gle/..." className="bg-slate-700 border-slate-600 text-white text-sm" />
              )}
            </Section>

            {/* Content */}
            <Section icon={Type} iconColor="text-blue-400" title="Content">
              <div className="space-y-3">
                <div className="grid grid-cols-4 gap-2">
                  <Label className="text-slate-300 col-span-1">Emoji</Label>
                  <Input value={lockPageConfig.emoji} onChange={e => updateCfg('emoji', e.target.value)} className="bg-slate-700 border-slate-600 text-white col-span-3 text-center text-xl" maxLength={4} />
                </div>
                <div>
                  <Label className="text-slate-300 mb-1 block">Title</Label>
                  <Input value={lockPageConfig.title} onChange={e => updateCfg('title', e.target.value)} className="bg-slate-700 border-slate-600 text-white" />
                </div>
                <div>
                  <Label className="text-slate-300 mb-1 block">Message</Label>
                  <Textarea value={lockPageConfig.message} onChange={e => updateCfg('message', e.target.value)} className="bg-slate-700 border-slate-600 text-white min-h-[60px]" />
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="showContact" checked={lockPageConfig.showContact} onChange={e => updateCfg('showContact', e.target.checked)} className="w-4 h-4 accent-purple-500" />
                  <Label htmlFor="showContact" className="text-slate-300 cursor-pointer">Show contact text</Label>
                </div>
                {lockPageConfig.showContact && (
                  <div>
                    <Label className="text-slate-300 mb-1 block">Contact Text</Label>
                    <Input value={lockPageConfig.contactText} onChange={e => updateCfg('contactText', e.target.value)} className="bg-slate-700 border-slate-600 text-white" />
                  </div>
                )}
                <div>
                  <Label className="text-slate-300 mb-1 block">Button Text</Label>
                  <Input value={lockPageConfig.buttonText} onChange={e => updateCfg('buttonText', e.target.value)} className="bg-slate-700 border-slate-600 text-white" />
                </div>
              </div>
            </Section>

            {/* Secret Code Unlock */}
            <Section icon={KeyRound} iconColor="text-amber-400" title="Secret Code Unlock">
              <div className="flex items-center gap-2 mb-3">
                <input type="checkbox" id="showSecretCode" checked={lockPageConfig.showSecretCode} onChange={e => updateCfg('showSecretCode', e.target.checked)} className="w-4 h-4 accent-amber-500" />
                <Label htmlFor="showSecretCode" className="text-slate-300 cursor-pointer">Show secret code input on lock page</Label>
              </div>
              {lockPageConfig.showSecretCode && (
                <div className="space-y-2">
                  <div>
                    <Label className="text-slate-300 mb-1 block">Hint text (shown above the input)</Label>
                    <Input value={lockPageConfig.secretCodeHint} onChange={e => updateCfg('secretCodeHint', e.target.value)}
                      placeholder="Enter the code your teacher gave you" className="bg-slate-700 border-slate-600 text-white" />
                  </div>
                  <p className="text-xs text-amber-300/70">💡 Create codes in the "Secret Codes" tab</p>
                </div>
              )}
            </Section>

            {/* Colors */}
            <Section icon={Palette} iconColor="text-amber-400" title="Colors">
              <div className="space-y-3">
                {[
                  { label: 'Background', field: 'backgroundColor' },
                  { label: 'Card', field: 'cardColor' },
                  { label: 'Text', field: 'textColor' },
                  { label: 'Accent', field: 'accentColor' },
                  { label: 'Button', field: 'buttonColor' },
                  { label: 'Button Text', field: 'buttonTextColor' },
                ].map(c => (
                  <div key={c.field} className="flex items-center gap-3">
                    <Label className="text-slate-300 w-28">{c.label}</Label>
                    <input type="color" value={lockPageConfig[c.field]} onChange={e => updateCfg(c.field, e.target.value)}
                      className="w-10 h-10 rounded-lg border border-slate-600 cursor-pointer bg-slate-700" />
                    <Input value={lockPageConfig[c.field]} onChange={e => updateCfg(c.field, e.target.value)} className="bg-slate-700 border-slate-600 text-white flex-1" />
                  </div>
                ))}

                {/* Background image */}
                <div className="pt-2 space-y-2">
                  <Label className="text-slate-300 mb-1 block flex items-center gap-2"><ImageIcon className="w-4 h-4" />Background Image (optional)</Label>
                  <div className="flex gap-2">
                    <Input value={lockPageConfig.backgroundImage} onChange={e => updateCfg('backgroundImage', e.target.value)} placeholder="Image URL or upload below" className="bg-slate-700 border-slate-600 text-white flex-1" />
                    <label className="cursor-pointer">
                      <input type="file" accept="image/*" onChange={handleBgUpload} className="hidden" disabled={bgUploading} />
                      <span className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-slate-300 hover:border-purple-500 text-sm">
                        {bgUploading ? <RotateCcw className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}Upload
                      </span>
                    </label>
                    {lockPageConfig.backgroundImage && (
                      <Button size="sm" variant="ghost" onClick={() => updateCfg('backgroundImage', '')} className="text-red-400">Clear</Button>
                    )}
                  </div>
                  {lockPageConfig.backgroundImage && (
                    <div className="flex flex-col gap-2 pt-1">
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="blurBg" checked={lockPageConfig.blurBackground} onChange={e => updateCfg('blurBackground', e.target.checked)} className="w-4 h-4 accent-purple-500" />
                        <Label htmlFor="blurBg" className="text-slate-300 cursor-pointer text-sm">Blur background image</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label className="text-slate-400 text-xs">Overlay darkness:</Label>
                        <input type="range" min="0" max="0.8" step="0.05" value={lockPageConfig.overlayOpacity} onChange={e => updateCfg('overlayOpacity', parseFloat(e.target.value))} className="flex-1 accent-purple-500" />
                        <span className="text-xs text-slate-400 w-10">{Math.round(lockPageConfig.overlayOpacity * 100)}%</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Section>
          </>
        )}

        {/* Save / Reset */}
        <div className="flex gap-2">
          <Button onClick={saveLockPageConfig} className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-500">
            <Save className="w-4 h-4 mr-2" />Save Design
          </Button>
          <Button onClick={resetConfig} variant="outline" className="border-slate-600 text-slate-300">
            <RotateCcw className="w-4 h-4 mr-1" />Reset
          </Button>
        </div>
      </div>

      {/* Right: Live Preview */}
      <div className="lg:sticky lg:top-4 h-fit">
        <div className="bg-slate-800 rounded-2xl p-3 border border-slate-700">
          <div className="flex items-center gap-2 mb-2 px-2">
            <span className="text-slate-300 text-sm font-medium">👁️ Live Preview</span>
          </div>
          <div className="rounded-xl overflow-hidden border border-slate-700">
            <div key={previewKey} className="h-[600px] overflow-y-auto">
              <LockedOverlay featureLabel="Game Studio" lockPageConfig={lockPageConfig} featureKey="games" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ icon: Icon, iconColor, title, children }) {
  return (
    <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700 space-y-3">
      <h3 className="text-white font-semibold flex items-center gap-2"><Icon className={`w-5 h-5 ${iconColor}`} />{title}</h3>
      {children}
    </div>
  );
}