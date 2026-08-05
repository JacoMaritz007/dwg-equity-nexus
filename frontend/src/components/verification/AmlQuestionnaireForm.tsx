import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';

interface AmlQuestionnaireFormProps {
  onSuccess?: () => void;
}

const SOURCE_OF_WEALTH_OPTIONS: { value: string; label: string }[] = [
  { value: 'employment', label: 'Employment / Salary' },
  { value: 'business_ownership', label: 'Business Ownership' },
  { value: 'inheritance', label: 'Inheritance' },
  { value: 'property_sale', label: 'Sale of Property' },
  { value: 'investment_gains', label: 'Investment Gains' },
  { value: 'pension', label: 'Pension' },
  { value: 'gift', label: 'Gift' },
  { value: 'other', label: 'Other' },
];

// Lower bound of each band, in Rand — sent to the backend as the numeric
// value while the label shows the range. Banded rather than an exact figure
// to keep this low-friction; still sufficient for FICA source-of-wealth
// purposes.
const AMOUNT_BANDS: { value: string; label: string }[] = [
  { value: '0', label: 'Under R250,000' },
  { value: '250000', label: 'R250,000 – R500,000' },
  { value: '500000', label: 'R500,000 – R1,000,000' },
  { value: '1000000', label: 'R1,000,000 – R5,000,000' },
  { value: '5000000', label: 'R5,000,000+' },
];

const NATIONALITY_OPTIONS = [
  { value: 'za', label: 'South Africa' },
  { value: 'us', label: 'United States' },
  { value: 'ca', label: 'Canada' },
  { value: 'uk', label: 'United Kingdom' },
  { value: 'other', label: 'Other' },
];

export const AmlQuestionnaireForm: React.FC<AmlQuestionnaireFormProps> = ({ onSuccess }) => {
  const { user } = useAuth();
  const [occupation, setOccupation] = useState('');
  const [employer, setEmployer] = useState('');
  const [nationality, setNationality] = useState('');
  const [placeOfBirth, setPlaceOfBirth] = useState('');
  const [sourceOfWealth, setSourceOfWealth] = useState<string[]>([]);
  const [annualIncome, setAnnualIncome] = useState('');
  const [netWorth, setNetWorth] = useState('');
  const [isPep, setIsPep] = useState<'yes' | 'no' | ''>('');
  const [pepDetails, setPepDetails] = useState('');
  const [declarationAccepted, setDeclarationAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const toggleSourceOfWealth = (value: string, checked: boolean) => {
    setSourceOfWealth((prev) => (checked ? [...prev, value] : prev.filter((v) => v !== value)));
  };

  const isValid =
    occupation.trim().length > 0 &&
    nationality.trim().length > 0 &&
    sourceOfWealth.length > 0 &&
    annualIncome !== '' &&
    netWorth !== '' &&
    isPep !== '' &&
    (isPep === 'no' || pepDetails.trim().length > 0) &&
    declarationAccepted;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !isValid) {
      toast.error('Please complete all required fields');
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/profiles/${user.id}/aml-questionnaire`, {
        occupation,
        employer: employer || undefined,
        nationality,
        placeOfBirth: placeOfBirth || undefined,
        sourceOfWealth,
        annualIncome,
        netWorth,
        isPep: isPep === 'yes',
        pepDetails: isPep === 'yes' ? pepDetails : undefined,
        declarationAccepted: true,
      });
      toast.success('AML declaration submitted — awaiting compliance review');
      onSuccess?.();
    } catch (error) {
      console.error('Error submitting AML questionnaire:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit declaration');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="occupation">Occupation *</Label>
          <Input
            id="occupation"
            value={occupation}
            onChange={(e) => setOccupation(e.target.value)}
            placeholder="e.g. Software Engineer"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="employer">Employer</Label>
          <Input
            id="employer"
            value={employer}
            onChange={(e) => setEmployer(e.target.value)}
            placeholder="Optional"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="nationality">Nationality *</Label>
          <Select value={nationality} onValueChange={setNationality}>
            <SelectTrigger id="nationality">
              <SelectValue placeholder="Select nationality" />
            </SelectTrigger>
            <SelectContent>
              {NATIONALITY_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="placeOfBirth">Place of Birth</Label>
          <Input
            id="placeOfBirth"
            value={placeOfBirth}
            onChange={(e) => setPlaceOfBirth(e.target.value)}
            placeholder="Optional"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Source of Wealth * (select all that apply)</Label>
        <div className="grid grid-cols-2 gap-2">
          {SOURCE_OF_WEALTH_OPTIONS.map((opt) => (
            <div key={opt.value} className="flex items-center gap-2">
              <Checkbox
                id={`sow-${opt.value}`}
                checked={sourceOfWealth.includes(opt.value)}
                onCheckedChange={(checked) => toggleSourceOfWealth(opt.value, checked === true)}
              />
              <Label htmlFor={`sow-${opt.value}`} className="text-sm font-normal cursor-pointer">
                {opt.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="annualIncome">Estimated Annual Income *</Label>
          <Select value={annualIncome} onValueChange={setAnnualIncome}>
            <SelectTrigger id="annualIncome">
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              {AMOUNT_BANDS.map((band) => (
                <SelectItem key={band.value} value={band.value}>
                  {band.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="netWorth">Estimated Net Worth *</Label>
          <Select value={netWorth} onValueChange={setNetWorth}>
            <SelectTrigger id="netWorth">
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              {AMOUNT_BANDS.map((band) => (
                <SelectItem key={band.value} value={band.value}>
                  {band.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2 p-4 border rounded-lg">
        <Label>Politically Exposed Person (PEP) Declaration *</Label>
        <p className="text-sm text-muted-foreground">
          Are you, or an immediate family member, or a known close business associate, a
          Politically Exposed Person — meaning you (or they) hold or have held a prominent
          public function in South Africa or any other country (e.g. head of state, senior
          politician, senior government, judicial or military official, senior executive of
          a state-owned enterprise, or senior political party official)?
        </p>
        <RadioGroup value={isPep} onValueChange={(v) => setIsPep(v as 'yes' | 'no')} className="flex gap-6 pt-1">
          <div className="flex items-center gap-2">
            <RadioGroupItem value="no" id="pep-no" />
            <Label htmlFor="pep-no" className="font-normal cursor-pointer">No</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="yes" id="pep-yes" />
            <Label htmlFor="pep-yes" className="font-normal cursor-pointer">Yes</Label>
          </div>
        </RadioGroup>
        {isPep === 'yes' && (
          <div className="space-y-2 pt-2">
            <Label htmlFor="pepDetails">Please explain *</Label>
            <Textarea
              id="pepDetails"
              value={pepDetails}
              onChange={(e) => setPepDetails(e.target.value)}
              placeholder="Whether this applies to you directly, a family member, or an associate; the position held; the country; and whether currently or formerly held."
              rows={3}
            />
          </div>
        )}
      </div>

      <div className="flex items-start gap-2">
        <Checkbox
          id="declaration"
          checked={declarationAccepted}
          onCheckedChange={(checked) => setDeclarationAccepted(checked === true)}
        />
        <Label htmlFor="declaration" className="text-sm font-normal cursor-pointer">
          I certify that the information provided above is true, accurate, and complete to
          the best of my knowledge.
        </Label>
      </div>

      <Button type="submit" disabled={!isValid || submitting} className="w-full">
        {submitting ? 'Submitting...' : 'Submit AML Declaration'}
      </Button>
    </form>
  );
};
