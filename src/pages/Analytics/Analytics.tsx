import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, Alert, Paper } from '@mui/material';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../../context/Authcontext';
import { getUserAnalytics, type UserAnalytics } from '../../services/analytics';

const Analytics: React.FC = () => {
  const { user } = useAuth();
  const [analyticsData, setAnalyticsData] = useState<UserAnalytics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!user?.uid) {
        setError('Please sign in to view analytics');
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const data = await getUserAnalytics(user.uid);
        console.log('User analytics:', data);
        if (!data || !data.uid || !data.email || typeof data.uid !== 'string' || typeof data.email !== 'string') {
          setError('Invalid analytics data received');
          setAnalyticsData(null);
          return;
        }
        let lastActive: string = 'N/A';
        if (typeof data.lastActive === 'string') {
          lastActive = data.lastActive;
        }
        setAnalyticsData({
          ...data,
          uid: data.uid,
          email: data.email,
          lastActive,
        });
      } catch (err) {
        console.error('Error fetching analytics:', err);
        setError('Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [user?.uid]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: 'background.default' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: 'background.default' }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!analyticsData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: 'background.default' }}>
        <Typography variant="body1" color="text.secondary" fontWeight="medium">No analytics data available</Typography>
      </Box>
    );
  }

  // Chart data for current user only
  const chartData = [
    { category: 'Your Messages', value: analyticsData.messageCount || 1, fill: '#3b82f6' },
    { category: 'Expected Activity', value: 10, fill: '#d1d5db' }, // Context for comparison
  ];

  const sessionData = [
    { category: 'Your Session', value: analyticsData.totalSessionDuration || 0, stroke: '#10b981' },
    { category: 'Average Session', value: 30, stroke: '#d1d5db' }, // Context for comparison
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f9fafb', py: 6, px: { xs: 2, sm: 4 } }}>
      <Typography
        variant="h4"
        sx={{
          fontSize: { xs: '1.8rem', sm: '2.2rem' },
          color: '#1f2937',
          fontWeight: '700',
          mb: 4,
          textAlign: 'center',
          textTransform: 'uppercase',
          letterSpacing: '1px',
        }}
      >
        Your Analytics Overview
      </Typography>
      <Box sx={{ maxWidth: 1000, mx: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {/* User Metrics Card */}
        <Paper
          sx={{
            p: { xs: 3, sm: 4 },
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            bgcolor: '#ffffff',
          }}
        >
          <Typography variant="h5" sx={{ fontSize: '1.5rem', color: '#1f2937', fontWeight: '600', mb: 1 }}>
            Your Activity Snapshot
          </Typography>
          <Typography variant="body2" sx={{ color: '#6b7280', mb: 3 }}>
            A quick summary of your recent activity
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <Box>
              <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: '500' }}>Email</Typography>
              <Typography variant="body1" sx={{ fontSize: '1.1rem', color: '#1f2937' }}>{analyticsData.email}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: '500' }}>Display Name</Typography>
              <Typography variant="body1" sx={{ fontSize: '1.1rem', color: '#1f2937' }}>{analyticsData.displayName || 'N/A'}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: '500' }}>Messages Sent</Typography>
              <Typography variant="body1" sx={{ fontSize: '1.1rem', color: '#1f2937' }}>{analyticsData.messageCount || 1}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: '500' }}>Sessions</Typography>
              <Typography variant="body1" sx={{ fontSize: '1.1rem', color: '#1f2937' }}>{analyticsData.sessionCount || 0}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: '500' }}>Total Session Duration</Typography>
              <Typography variant="body1" sx={{ fontSize: '1.1rem', color: '#1f2937' }}>{analyticsData.totalSessionDuration || 0} seconds</Typography>
            </Box>
            <Box>
              <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: '500' }}>Last Active</Typography>
              <Typography variant="body1" sx={{ fontSize: '1.1rem', color: '#1f2937' }}>{analyticsData.lastActive}</Typography>
            </Box>
          </Box>
        </Paper>

        {/* Message Count Bar Chart */}
        <Paper
          sx={{
            p: { xs: 3, sm: 4 },
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            bgcolor: '#ffffff',
          }}
        >
          <Typography variant="h5" sx={{ fontSize: '1.5rem', color: '#1f2937', fontWeight: '600', mb: 1 }}>
            Message Activity
          </Typography>
          <Typography variant="body2" sx={{ color: '#6b7280', mb: 3 }}>
            Your message count compared to typical activity
          </Typography>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
              <XAxis dataKey="category" tick={{ fontSize: 11, fill: '#6b7280' }} />
              <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="value" name="Messages" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Paper>

        {/* Session Duration Line Chart */}
        <Paper
          sx={{
            p: { xs: 3, sm: 4 },
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            bgcolor: '#ffffff',
          }}
        >
          <Typography variant="h5" sx={{ fontSize: '1.5rem', color: '#1f2937', fontWeight: '600', mb: 1 }}>
            Session Duration
          </Typography>
          <Typography variant="body2" sx={{ color: '#6b7280', mb: 3 }}>
            Your session time compared to typical duration
          </Typography>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={sessionData} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
              <XAxis dataKey="category" tick={{ fontSize: 11, fill: '#6b7280' }} />
              <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  fontSize: '12px',
                }}
              />
              <Line type="monotone" dataKey="value" name="Duration (s)" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Paper>
      </Box>
    </Box>
  );
};

export default Analytics;