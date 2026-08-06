import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Mail } from 'lucide-react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { toast } from 'sonner';

const CATEGORIES: {
  key: 'notifyNewOfferings' | 'notifyCapitalCalls' | 'notifyDocumentUpdates' | 'notifyMarketing';
  label: string;
  description: string;
}[] = [
  {
    key: 'notifyNewOfferings',
    label: 'New Investment Opportunities',
    description: 'When a new offering opens for pledging',
  },
  {
    key: 'notifyCapitalCalls',
    label: 'Capital Calls',
    description: 'When a capital call is issued against a pledge you’ve made',
  },
  {
    key: 'notifyDocumentUpdates',
    label: 'Document & Verification Updates',
    description: 'Reviews, approvals, or requests related to your documents',
  },
  {
    key: 'notifyMarketing',
    label: 'Marketing & News',
    description: 'Occasional updates about the platform. Off by default.',
  },
];

export const EmailPreferencesPage: React.FC = () => {
  const { profile, loading, updateProfile } = useUserProfile();
  const [saving, setSaving] = useState(false);
  const [prefs, setPrefs] = useState({
    notifyNewOfferings: true,
    notifyCapitalCalls: true,
    notifyDocumentUpdates: true,
    notifyMarketing: false,
  });

  useEffect(() => {
    if (!profile) return;
    setPrefs({
      notifyNewOfferings: profile.notifyNewOfferings ?? true,
      notifyCapitalCalls: profile.notifyCapitalCalls ?? true,
      notifyDocumentUpdates: profile.notifyDocumentUpdates ?? true,
      notifyMarketing: profile.notifyMarketing ?? false,
    });
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile(prefs);
      toast.success('Preferences saved');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse h-48 bg-muted rounded-lg" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Email Preferences</h1>
        <p className="text-muted-foreground">Choose what we email you about.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>
            These preferences are saved now; email delivery for these categories is being built.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {CATEGORIES.map((cat) => (
            <div key={cat.key} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="pr-4">
                <Label htmlFor={cat.key} className="font-medium">
                  {cat.label}
                </Label>
                <p className="text-xs text-muted-foreground">{cat.description}</p>
              </div>
              <Switch
                id={cat.key}
                checked={prefs[cat.key]}
                onCheckedChange={(checked) => setPrefs({ ...prefs, [cat.key]: checked })}
              />
            </div>
          ))}

          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? 'Saving...' : 'Save Preferences'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
