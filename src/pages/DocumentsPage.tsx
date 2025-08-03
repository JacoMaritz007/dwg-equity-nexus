import React from 'react';
import { Navigation } from '@/components/layout/Navigation';
import { DocumentsDashboard } from '@/components/documents/DocumentsDashboard';

export const DocumentsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
            <p className="text-muted-foreground mt-2">
              Access and manage all your investment-related documents, verification documents, and account statements.
            </p>
          </div>
          <DocumentsDashboard />
        </div>
      </main>
    </div>
  );
};