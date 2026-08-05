import React from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  FileText, 
  AlertCircle,
  Activity,
  BarChart3,
  Calendar
} from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminDashboard: React.FC = () => {
  const { isAdmin } = usePermissions();

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

  const stats = [
    {
      title: "Total Investments",
      value: "R2.4M",
      change: "+12.5%",
      icon: DollarSign,
      color: "text-green-600"
    },
    {
      title: "Active Users",
      value: "1,234",
      change: "+5.2%",
      icon: Users,
      color: "text-blue-600"
    },
    {
      title: "Active Offerings",
      value: "8",
      change: "+2",
      icon: TrendingUp,
      color: "text-purple-600"
    },
    {
      title: "Pending Reviews",
      value: "23",
      change: "-3",
      icon: AlertCircle,
      color: "text-orange-600"
    }
  ];

  const quickActions = [
    {
      title: "Create Investment Offering",
      description: "Launch a new investment opportunity",
      href: "/admin/offerings/create",
      icon: TrendingUp,
      variant: "default" as const
    },
    {
      title: "Manage Users",
      description: "View and manage user accounts",
      href: "/admin/users",
      icon: Users,
      variant: "outline" as const
    },
    {
      title: "Send Update",
      description: "Publish update to investors",
      href: "/admin/updates/create",
      icon: FileText,
      variant: "outline" as const
    },
    {
      title: "Create Capital Call",
      description: "Request additional capital from investors",
      href: "/admin/capital-calls/create",
      icon: Calendar,
      variant: "outline" as const
    }
  ];

  const recentActivity = [
    { action: "New user registration", user: "John Doe", time: "2 minutes ago" },
    { action: "Investment completed", user: "Jane Smith", time: "1 hour ago" },
    { action: "Document uploaded", user: "Mike Johnson", time: "3 hours ago" },
    { action: "Capital call responded", user: "Sarah Wilson", time: "5 hours ago" }
  ];

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Manage your Gainscape platform and track key metrics
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  <span className={stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}>
                    {stat.change}
                  </span>
                  {" "}from last month
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common administrative tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <Link key={index} to={action.href}>
                    <Button 
                      variant={action.variant} 
                      className="w-full h-auto p-4 flex flex-col items-start gap-2"
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span className="font-medium">{action.title}</span>
                      </div>
                      <span className="text-xs text-left opacity-70">
                        {action.description}
                      </span>
                    </Button>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex flex-col space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{activity.action}</span>
                    <Badge variant="secondary" className="text-xs">
                      {activity.time}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    by {activity.user}
                  </span>
                </div>
              ))}
            </div>
            <Button variant="ghost" className="w-full mt-4" asChild>
              <Link to="/admin/activity">
                View All Activity
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Management Links */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/admin/offerings">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5" />
                Offerings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Manage investment opportunities
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/admin/users">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5" />
                Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                User accounts and permissions
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/admin/documents">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5" />
                Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Document management system
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/admin/analytics">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="h-5 w-5" />
                Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Platform insights and reports
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
};

export default AdminDashboard;