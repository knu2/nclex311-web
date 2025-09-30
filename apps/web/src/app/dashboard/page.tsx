'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Typography,
  Box,
  Tabs,
  Tab,
  Paper,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Search as SearchIcon,
  MenuBook as AllConceptsIcon,
  Bookmark as BookmarkIcon,
  CheckCircle as CompletedIcon,
} from '@mui/icons-material';
import { ChapterList } from '@/components/ChapterList';
import { ChapterWithConcepts } from '@/lib/db/services';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

/**
 * Tab panel component for tabbed content
 */
const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

/**
 * Dashboard page component with tabbed navigation
 */
export default function DashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0);
  const [chapters, setChapters] = useState<ChapterWithConcepts[]>([]);
  const [filteredChapters, setFilteredChapters] = useState<ChapterWithConcepts[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch chapters data
  useEffect(() => {
    const fetchChapters = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/chapters');
        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.message || 'Failed to fetch chapters');
        }
        
        if (result.success) {
          setChapters(result.data);
          setFilteredChapters(result.data);
        } else {
          throw new Error(result.error || 'Failed to fetch chapters');
        }
      } catch (err) {
        console.error('Error fetching chapters:', err);
        setError(err instanceof Error ? err.message : 'Failed to load content');
      } finally {
        setLoading(false);
      }
    };

    fetchChapters();
  }, []);

  // Filter chapters based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredChapters(chapters);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = chapters.map(chapter => ({
      ...chapter,
      concepts: chapter.concepts.filter(concept =>
        concept.title.toLowerCase().includes(query) ||
        `concept ${concept.conceptNumber}`.toLowerCase().includes(query) ||
        `chapter ${chapter.chapterNumber}`.toLowerCase().includes(query) ||
        chapter.title.toLowerCase().includes(query)
      )
    })).filter(chapter => 
      chapter.concepts.length > 0 || 
      chapter.title.toLowerCase().includes(query) ||
      `chapter ${chapter.chapterNumber}`.toLowerCase().includes(query)
    );

    setFilteredChapters(filtered);
  }, [searchQuery, chapters]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleConceptClick = (conceptSlug: string) => {
    router.push(`/concepts/${conceptSlug}`);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const tabs = [
    { label: 'All Concepts', icon: AllConceptsIcon },
    { label: 'My Bookmarks', icon: BookmarkIcon },
    { label: 'Completed', icon: CompletedIcon },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h1" component="h1" gutterBottom>
          Welcome back!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Continue your NCLEX-RN preparation journey. Free access to Chapters 1-4, upgrade for full content.
        </Typography>
      </Box>

      {/* Search Bar */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search concepts and chapters..."
          value={searchQuery}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'background.paper',
            },
          }}
        />
      </Box>

      {/* Tabbed Content */}
      <Paper sx={{ borderRadius: 2 }}>
        {/* Tab Headers */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            aria-label="dashboard content tabs"
            variant="fullWidth"
            sx={{
              '& .MuiTab-root': {
                minHeight: 64,
                textTransform: 'none',
                fontSize: '0.95rem',
                fontWeight: 500,
              },
            }}
          >
            {tabs.map((tab, index) => {
              const IconComponent = tab.icon;
              return (
                <Tab
                  key={index}
                  label={tab.label}
                  icon={<IconComponent />}
                  iconPosition="start"
                  id={`dashboard-tab-${index}`}
                  aria-controls={`dashboard-tabpanel-${index}`}
                  sx={{
                    '& .MuiSvgIcon-root': {
                      mr: 1,
                    },
                  }}
                />
              );
            })}
          </Tabs>
        </Box>

        {/* Tab Content */}
        <Box sx={{ p: 2 }}>
          {/* All Concepts Tab */}
          <TabPanel value={activeTab} index={0}>
            <ChapterList
              chapters={filteredChapters}
              loading={loading}
              error={error}
              onConceptClick={handleConceptClick}
            />
            
            {searchQuery && filteredChapters.length === 0 && !loading && !error && (
              <Box textAlign="center" py={4}>
                <Typography variant="body1" color="text.secondary">
                  No concepts found matching &quot;{searchQuery}&quot;
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Try adjusting your search terms or browse all chapters.
                </Typography>
              </Box>
            )}
          </TabPanel>

          {/* My Bookmarks Tab */}
          <TabPanel value={activeTab} index={1}>
            <Box textAlign="center" py={6}>
              <BookmarkIcon 
                sx={{ 
                  fontSize: 64, 
                  color: 'text.disabled', 
                  mb: 2 
                }} 
              />
              <Typography variant="h3" color="text.secondary" gutterBottom>
                Bookmarks Coming Soon
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Save your favorite concepts for quick access. This feature will be available in the next update.
              </Typography>
            </Box>
          </TabPanel>

          {/* Completed Tab */}
          <TabPanel value={activeTab} index={2}>
            <Box textAlign="center" py={6}>
              <CompletedIcon 
                sx={{ 
                  fontSize: 64, 
                  color: 'text.disabled', 
                  mb: 2 
                }} 
              />
              <Typography variant="h3" color="text.secondary" gutterBottom>
                Progress Tracking Coming Soon
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Track your completed concepts and overall progress. This feature will be available in the next update.
              </Typography>
            </Box>
          </TabPanel>
        </Box>
      </Paper>
    </Container>
  );
}