import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AmlQuestionnaireForm } from './AmlQuestionnaireForm';

export interface AmlQuestionnaireModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AmlQuestionnaireModal: React.FC<AmlQuestionnaireModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const handleSuccess = () => {
    onSuccess?.();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Complete AML Declaration</DialogTitle>
          <DialogDescription>
            South African law (FICA) requires us to collect this information as part of
            anti-money-laundering due diligence before you can invest. Your answers are
            reviewed by our compliance team.
          </DialogDescription>
        </DialogHeader>

        <AmlQuestionnaireForm onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
};
