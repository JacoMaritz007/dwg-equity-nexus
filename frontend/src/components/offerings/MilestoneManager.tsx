import React from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Milestone {
  id: string;
  description: string;
  date: Date | null;
}

interface MilestoneManagerProps {
  milestones: Milestone[];
  onChange: (milestones: Milestone[]) => void;
  maxMilestones?: number;
}

export const MilestoneManager: React.FC<MilestoneManagerProps> = ({
  milestones,
  onChange,
  maxMilestones = 5
}) => {
  const addMilestone = () => {
    if (milestones.length >= maxMilestones) return;
    
    const newMilestone: Milestone = {
      id: Date.now().toString(),
      description: '',
      date: null
    };
    
    onChange([...milestones, newMilestone]);
  };

  const removeMilestone = (id: string) => {
    onChange(milestones.filter(milestone => milestone.id !== id));
  };

  const updateMilestone = (id: string, updates: Partial<Milestone>) => {
    onChange(milestones.map(milestone => 
      milestone.id === id ? { ...milestone, ...updates } : milestone
    ));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">
          Project Milestones ({milestones.length}/{maxMilestones})
        </Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addMilestone}
          disabled={milestones.length >= maxMilestones}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Milestone
        </Button>
      </div>

      {milestones.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No milestones added yet.</p>
          <p className="text-sm">Click "Add Milestone" to create your first milestone.</p>
        </div>
      )}

      <div className="space-y-4">
        {milestones.map((milestone, index) => (
          <div key={milestone.id} className="p-4 border rounded-lg space-y-4">
            <div className="flex items-center justify-between">
              <Label className="font-medium">Milestone {index + 1}</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeMilestone(milestone.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor={`milestone-desc-${milestone.id}`}>
                  Description
                </Label>
                <Textarea
                  id={`milestone-desc-${milestone.id}`}
                  placeholder="Describe this project milestone..."
                  value={milestone.description}
                  onChange={(e) => updateMilestone(milestone.id, { description: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor={`milestone-date-${milestone.id}`}>
                  Milestone Date
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal mt-1",
                        !milestone.date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {milestone.date ? format(milestone.date, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={milestone.date || undefined}
                      onSelect={(date) => updateMilestone(milestone.id, { date: date || null })}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};