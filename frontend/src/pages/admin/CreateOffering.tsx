import React from 'react';
import { CreateOfferingForm } from '@/components/offerings/CreateOfferingForm';
import { usePermissions } from '@/hooks/usePermissions';

const CreateOffering: React.FC = () => {
  const { canAccessAdmin } = usePermissions();

  if (!canAccessAdmin()) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return <CreateOfferingForm />;
};

export default CreateOffering;