import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DocumentUploader } from './DocumentUploader';

export interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentCategory?: 'identity' | 'address' | 'financial';
  onSuccess?: () => void;
}

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  isOpen,
  onClose,
  documentCategory,
  onSuccess,
}) => {
  const getCategoryInfo = () => {
    switch (documentCategory) {
      case 'identity':
        return {
          title: 'Upload Identity Documents',
          description: 'Upload government-issued identification documents to verify your identity.',
          acceptedTypes: ['passport', 'national_id', 'driving_license'],
          guidelines: [
            'Document must be valid and not expired',
            'All corners of the document must be visible',
            'Text must be clear and readable',
            'No reflections or glare'
          ]
        };
      case 'address':
        return {
          title: 'Upload Proof of Address',
          description: 'Upload documents that confirm your current residential address.',
          acceptedTypes: ['proof_of_address'],
          guidelines: [
            'Document must be dated within the last 3 months',
            'Must show your full name and address',
            'Accepted: utility bills, bank statements, government correspondence',
            'Document must be clear and readable'
          ]
        };
      case 'financial':
        return {
          title: 'Upload Financial Documents',
          description: 'Upload documents to verify your financial status and source of wealth.',
          acceptedTypes: ['bank_statement', 'income_verification', 'source_of_wealth', 'sophisticated_investor_cert', 'professional_qualification'],
          guidelines: [
            'Bank statements from the last 3 months',
            'Income verification or payslips',
            'Source of wealth documentation',
            'Professional qualifications (if applicable)'
          ]
        };
      default:
        return {
          title: 'Upload Documents',
          description: 'Upload your verification documents.',
          acceptedTypes: undefined,
          guidelines: []
        };
    }
  };

  const categoryInfo = getCategoryInfo();

  const handleSuccess = () => {
    onSuccess?.();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{categoryInfo.title}</DialogTitle>
          <DialogDescription>{categoryInfo.description}</DialogDescription>
        </DialogHeader>

        {categoryInfo.guidelines.length > 0 && (
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <h4 className="font-medium text-sm">Document Guidelines:</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              {categoryInfo.guidelines.map((guideline, index) => (
                <li key={index}>• {guideline}</li>
              ))}
            </ul>
          </div>
        )}

        <DocumentUploader 
          onSuccess={handleSuccess}
          preselectedCategory={documentCategory}
          allowedDocumentTypes={categoryInfo.acceptedTypes}
        />
      </DialogContent>
    </Dialog>
  );
};