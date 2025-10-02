export const REFRESH_RATES = [
  { value: 'never', label: 'Never' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
] as const;

export const LLM_CHUNKING_STRATEGIES = [
  {
    value: 'smart_chunking',
    label: 'Smart chunking',
    description: 'Breaks up your data into logical sections grouped by topic. Best for complex documents with varied topics.',
  },
  {
    value: 'faq_optimization',
    label: 'FAQ optimization',
    description: 'Creates sample questions that each section could answer. Best for building FAQs.',
  },
  {
    value: 'remove_html_noise',
    label: 'Remove HTML and noise',
    description: 'Cleans up messy website formatting to make text easier to group. Best for website or markdown formatting.',
  },
  {
    value: 'add_topic_headers',
    label: 'Add topic headers',
    description: 'Adds brief summaries at the start of each section. Best for long documents needing context.',
  },
  {
    value: 'summarize',
    label: 'Summarize',
    description: 'Keeps only the key points and removes filler content. Best for dense, lengthy content.',
  },
] as const;

export const FOLDERS = [
  { value: 'all_data_sources', label: 'All data sources' },
  { value: 'documentation', label: 'Documentation' },
  { value: 'support', label: 'Support' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'product', label: 'Product' },
] as const;

export const DATA_SOURCE_TYPES = [
  { value: 'url', label: 'URL(s)', icon: '🌐' },
  { value: 'sitemap', label: 'Sitemap', icon: '🗺️' },
  { value: 'file', label: 'Upload file', icon: '📁' },
  { value: 'text', label: 'Plain text', icon: '📝' },
] as const;

export type RefreshRate = typeof REFRESH_RATES[number]['value'];
export type ChunkingStrategy = typeof LLM_CHUNKING_STRATEGIES[number]['value'];
export type FolderType = typeof FOLDERS[number]['value'];
export type DataSourceType = typeof DATA_SOURCE_TYPES[number]['value'];
