import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar, 
  Download, 
  Search, 
  Filter, 
  TrendingUp, 
  TrendingDown, 
  ArrowRight,
  DollarSign,
  FileText,
  Clock
} from 'lucide-react';
import { useTransactions } from '@/hooks/useTransactions';
import { formatCurrency } from '@/utils/offeringHelpers';

export const TransactionsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState('');
  const [transactionType, setTransactionType] = useState('all');
  
  const { transactions, accountSummary, loading, error } = useTransactions();

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Account & Transactions</h1>
        <p className="text-muted-foreground">
          View, filter, and download your transaction history and account details.
        </p>
      </div>

      {/* Account Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cash Available</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(accountSummary.cashAvailable)}</div>
            <p className="text-xs text-muted-foreground">Available for investment</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Investments</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(accountSummary.totalInvestments)}</div>
            <p className="text-xs text-success">Active portfolio value</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Distributions</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(accountSummary.pendingDistributions)}</div>
            <p className="text-xs text-muted-foreground">Awaiting distribution</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Capital Calls</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(accountSummary.recentCapitalCalls)}</div>
            <p className="text-xs text-muted-foreground">Capital call payments</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search transactions..." 
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex gap-4">
              <Input
                type="date"
                placeholder="Date range"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-40"
              />
              
              <Select value={transactionType} onValueChange={setTransactionType}>
                <SelectTrigger className="w-40">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="contribution">Contribution</SelectItem>
                  <SelectItem value="distribution">Distribution</SelectItem>
                  <SelectItem value="fee">Fee</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction List */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-muted rounded-full"></div>
                      <div className="space-y-1">
                        <div className="h-4 bg-muted rounded w-32"></div>
                        <div className="h-3 bg-muted rounded w-24"></div>
                      </div>
                    </div>
                    <div className="h-4 bg-muted rounded w-20"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-destructive">{error}</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No transactions found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions
                .filter(transaction => {
                  const matchesSearch = !searchQuery || 
                    transaction.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    transaction.reference_number?.toLowerCase().includes(searchQuery.toLowerCase());
                  const matchesType = transactionType === 'all' || transaction.type === transactionType;
                  return matchesSearch && matchesType;
                })
                .map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        {transaction.type === 'contribution' && <TrendingUp className="h-5 w-5 text-primary" />}
                        {transaction.type === 'distribution' && <TrendingDown className="h-5 w-5 text-success" />}
                        {transaction.type === 'fee' && <DollarSign className="h-5 w-5 text-orange-500" />}
                        {transaction.type === 'expense' && <FileText className="h-5 w-5 text-muted-foreground" />}
                      </div>
                      <div>
                        <p className="font-medium">{transaction.description || 'Transaction'}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{new Date(transaction.transaction_date).toLocaleDateString()}</span>
                          {transaction.reference_number && (
                            <>
                              <span>•</span>
                              <span>Ref: {transaction.reference_number}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${
                        transaction.type === 'distribution' ? 'text-success' : 
                        ['contribution', 'fee', 'expense'].includes(transaction.type) ? 'text-destructive' : ''
                      }`}>
                        {transaction.type === 'distribution' ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount))}
                      </p>
                       <Badge variant="default" className="text-xs">
                         Completed
                       </Badge>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};