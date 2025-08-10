import React, { useState, useEffect } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { useVerificationStatus } from '@/hooks/useVerificationStatus';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AdminScreeningModal } from '@/components/admin/AdminScreeningModal';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Search, 
  MoreHorizontal, 
  Shield, 
  User, 
  Mail,
  Calendar,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  UserCheck
} from 'lucide-react';

interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  is_accredited: boolean;
  kyc_verified: boolean;
  created_at: string;
  roles: string[];
  total_invested?: number;
  active_investments?: number;
  verification_status?: {
    overall_progress: number;
    identity_verified: boolean;
    address_verified: boolean;
    financial_verified: boolean;
    pep_screened: boolean;
    sanctions_screened: boolean;
    can_invest: boolean;
  };
}

const UserManagement: React.FC = () => {
  const { isAdmin } = usePermissions();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [screeningModal, setScreeningModal] = useState<{
    isOpen: boolean;
    userId: string;
    userName: string;
    userEmail: string;
    screeningType: 'pep' | 'sanctions';
  }>({
    isOpen: false,
    userId: '',
    userName: '',
    userEmail: '',
    screeningType: 'pep'
  });

  if (!isAdmin()) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
          <p className="text-muted-foreground mt-2">You don't have admin permissions.</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      
      // Fetch user profiles with their roles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          email,
          phone,
          is_accredited,
          kyc_verified,
          created_at
        `);

      if (profilesError) throw profilesError;

      // Fetch user roles
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Fetch investment totals
      const { data: investments, error: investmentsError } = await supabase
        .from('user_investments')
        .select('user_id, investment_amount, status');

      if (investmentsError) throw investmentsError;

      // Fetch verification documents for each user
      const userIds = profiles?.map(p => p.id) || [];
      const { data: documents, error: docsError } = await supabase
        .from('verification_documents')
        .select('user_id, document_type, verification_status')
        .in('user_id', userIds)
        .eq('verification_status', 'approved');

      if (docsError) throw docsError;

      // Fetch compliance screening documents
      const { data: screeningDocs, error: screeningError } = await supabase
        .from('compliance_screening_documents')
        .select('user_id, screening_type, status')
        .in('user_id', userIds)
        .eq('status', 'approved');

      if (screeningError) throw screeningError;

      // Combine the data
      const usersWithRoles = profiles?.map(profile => {
        const roles = userRoles?.filter(role => role.user_id === profile.id).map(role => role.role) || [];
        const userInvestments = investments?.filter(inv => inv.user_id === profile.id) || [];
        const totalInvested = userInvestments.reduce((sum, inv) => sum + (inv.investment_amount || 0), 0);
        const activeInvestments = userInvestments.filter(inv => inv.status === 'active').length;

        // Get approved documents for this user
        const userDocs = documents?.filter(doc => doc.user_id === profile.id) || [];
        const approvedDocTypes = new Set(userDocs.map(doc => doc.document_type));
        
        // Check verification status
        const hasIdentityDoc = approvedDocTypes.has('passport') || 
                              approvedDocTypes.has('national_id') || 
                              approvedDocTypes.has('driving_license');
        const hasAddressDoc = approvedDocTypes.has('proof_of_address');
        const hasFinancialDoc = approvedDocTypes.has('bank_statement') || 
                               approvedDocTypes.has('income_verification') || 
                               approvedDocTypes.has('source_of_wealth');

        // Get screening status
        const userScreenings = screeningDocs?.filter(doc => doc.user_id === profile.id) || [];
        const approvedScreenings = new Set(userScreenings.map(doc => doc.screening_type));
        const pep_screened = approvedScreenings.has('pep');
        const sanctions_screened = approvedScreenings.has('sanctions');
        
        const totalSteps = 5;
        const completedSteps = [hasIdentityDoc, hasAddressDoc, hasFinancialDoc, pep_screened, sanctions_screened].filter(Boolean).length;
        const overall_progress = (completedSteps / totalSteps) * 100;
        const can_invest = hasIdentityDoc && hasAddressDoc && hasFinancialDoc && pep_screened && sanctions_screened;

        return {
          ...profile,
          roles,
          total_invested: totalInvested,
          active_investments: activeInvestments,
          verification_status: {
            overall_progress,
            identity_verified: hasIdentityDoc,
            address_verified: hasAddressDoc,
            financial_verified: hasFinancialDoc,
            pep_screened,
            sanctions_screened,
            can_invest
          }
        };
      }) || [];

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserRole = async (userId: string, role: 'admin' | 'investor', action: 'add' | 'remove') => {
    try {
      if (action === 'add') {
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role });
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .match({ user_id: userId, role });
        
        if (error) throw error;
      }

      toast({
        title: "Success",
        description: `User role ${action === 'add' ? 'added' : 'removed'} successfully.`
      });

      fetchUsers(); // Refresh the user list
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: "Error",
        description: "Failed to update user role. Please try again.",
        variant: "destructive"
      });
    }
  };

  const toggleKYCStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ kyc_verified: !currentStatus })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `KYC status ${!currentStatus ? 'verified' : 'unverified'} successfully.`
      });

      fetchUsers(); // Refresh the user list
    } catch (error) {
      console.error('Error updating KYC status:', error);
      toast({
        title: "Error",
        description: "Failed to update KYC status. Please try again.",
        variant: "destructive"
      });
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      (user.first_name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (user.last_name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (user.email?.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesTab = selectedTab === 'all' || 
      (selectedTab === 'admin' && user.roles.includes('admin')) ||
      (selectedTab === 'investor' && user.roles.includes('investor')) ||
      (selectedTab === 'unverified' && !user.kyc_verified);
    
    return matchesSearch && matchesTab;
  });

  const formatCurrency = (amount: number | undefined) => {
    if (!amount) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'investor': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const canPerformScreening = (user: UserProfile, screeningType: 'pep' | 'sanctions') => {
    const verification = user.verification_status;
    if (!verification) return false;
    
    const documentsVerified = verification.identity_verified && 
                              verification.address_verified && 
                              verification.financial_verified;
    
    if (screeningType === 'pep') {
      return documentsVerified && !verification.pep_screened;
    } else {
      return documentsVerified && !verification.sanctions_screened;
    }
  };

  const openScreeningModal = (user: UserProfile, screeningType: 'pep' | 'sanctions') => {
    setScreeningModal({
      isOpen: true,
      userId: user.id,
      userName: `${user.first_name} ${user.last_name}`,
      userEmail: user.email || '',
      screeningType
    });
  };

  const handleScreeningComplete = () => {
    setScreeningModal(prev => ({ ...prev, isOpen: false }));
    fetchUsers(); // Refresh the user list
  };

  const getVerificationBadges = (verification: UserProfile['verification_status']) => {
    if (!verification) return null;
    
    const badges = [
      { label: 'ID', verified: verification.identity_verified, icon: FileText },
      { label: 'Address', verified: verification.address_verified, icon: FileText },
      { label: 'Financial', verified: verification.financial_verified, icon: FileText },
      { label: 'PEP', verified: verification.pep_screened, icon: UserCheck },
      { label: 'Sanctions', verified: verification.sanctions_screened, icon: UserCheck },
    ];

    return (
      <div className="flex gap-1 flex-wrap">
        {badges.map(({ label, verified, icon: Icon }) => (
          <TooltipProvider key={label}>
            <Tooltip>
              <TooltipTrigger>
                <Badge 
                  variant={verified ? "default" : "secondary"}
                  className={`text-xs ${verified ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}
                >
                  <Icon className="h-3 w-3 mr-1" />
                  {label}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>{label} {verified ? 'Verified' : 'Pending'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <p className="text-muted-foreground">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage user accounts, roles, and verification status
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All Users ({users.length})</TabsTrigger>
          <TabsTrigger value="admin">Admins ({users.filter(u => u.roles.includes('admin')).length})</TabsTrigger>
          <TabsTrigger value="investor">Investors ({users.filter(u => u.roles.includes('investor')).length})</TabsTrigger>
          <TabsTrigger value="unverified">Unverified ({users.filter(u => !u.kyc_verified).length})</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Users</CardTitle>
              <CardDescription>
                {filteredUsers.length} users found
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Verification Status</TableHead>
                    <TableHead>Investments</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.first_name} ${user.last_name}`} />
                            <AvatarFallback>
                              {user.first_name?.[0]}{user.last_name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {user.first_name} {user.last_name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {user.roles.map(role => (
                            <Badge 
                              key={role} 
                              className={getRoleBadgeColor(role)}
                            >
                              {role}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="flex-1">
                              <Progress 
                                value={user.verification_status?.overall_progress || 0} 
                                className="h-2"
                              />
                            </div>
                            <span className="text-xs text-muted-foreground min-w-[3rem]">
                              {Math.round(user.verification_status?.overall_progress || 0)}%
                            </span>
                            {user.verification_status?.can_invest && (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            )}
                          </div>
                          {getVerificationBadges(user.verification_status)}
                          <div className="flex gap-1">
                            {user.kyc_verified && (
                              <Badge className="bg-green-100 text-green-800 text-xs">
                                KYC
                              </Badge>
                            )}
                            {user.is_accredited && (
                              <Badge className="bg-purple-100 text-purple-800 text-xs">
                                Accredited
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p className="font-medium">
                            {formatCurrency(user.total_invested)}
                          </p>
                          <p className="text-muted-foreground">
                            {user.active_investments} active
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {new Date(user.created_at).toLocaleDateString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {/* Screening Actions */}
                            {canPerformScreening(user, 'pep') && (
                              <DropdownMenuItem 
                                onClick={() => openScreeningModal(user, 'pep')}
                              >
                                <UserCheck className="h-4 w-4 mr-2" />
                                PEP Screen
                              </DropdownMenuItem>
                            )}
                            {canPerformScreening(user, 'sanctions') && (
                              <DropdownMenuItem 
                                onClick={() => openScreeningModal(user, 'sanctions')}
                              >
                                <UserCheck className="h-4 w-4 mr-2" />
                                Sanctions Screen
                              </DropdownMenuItem>
                            )}
                            {(canPerformScreening(user, 'pep') || canPerformScreening(user, 'sanctions')) && (
                              <DropdownMenuSeparator />
                            )}
                            
                            {/* KYC Actions */}
                            <DropdownMenuItem 
                              onClick={() => toggleKYCStatus(user.id, user.kyc_verified)}
                            >
                              {user.kyc_verified ? (
                                <>
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Unverify KYC
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Verify KYC
                                </>
                              )}
                            </DropdownMenuItem>
                            
                            <DropdownMenuSeparator />
                            
                            {/* Role Actions */}
                            {!user.roles.includes('admin') && (
                              <DropdownMenuItem 
                                onClick={() => updateUserRole(user.id, 'admin', 'add')}
                              >
                                <Shield className="h-4 w-4 mr-2" />
                                Make Admin
                              </DropdownMenuItem>
                            )}
                            {user.roles.includes('admin') && (
                              <DropdownMenuItem 
                                onClick={() => updateUserRole(user.id, 'admin', 'remove')}
                                className="text-destructive"
                              >
                                <Shield className="h-4 w-4 mr-2" />
                                Remove Admin
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredUsers.length === 0 && (
                <div className="text-center py-12">
                  <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No users found</h3>
                  <p className="text-muted-foreground">
                    {searchQuery ? 'Try adjusting your search terms.' : 'No users match the current filter.'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Screening Modal */}
      <AdminScreeningModal
        open={screeningModal.isOpen}
        onOpenChange={(open) => setScreeningModal(prev => ({ ...prev, isOpen: open }))}
        userId={screeningModal.userId}
        userName={screeningModal.userName}
        userEmail={screeningModal.userEmail}
        screeningType={screeningModal.screeningType}
        onScreeningComplete={handleScreeningComplete}
      />
    </div>
  );
};

export default UserManagement;