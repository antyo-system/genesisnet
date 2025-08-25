export type Item = {
  id: string;
  title: string;
  content: string;
  tags: string[];
};

export const DATA: Item[] = [
  {
    id: '1',
    title: 'AI Agent Market',
    content: 'Autonomous agents on-chain',
    tags: ['ai', 'agent', 'icp'],
  },
  {
    id: '2',
    title: 'GenesisNet Metrics',
    content: 'Prometheus + Grafana wiring',
    tags: ['metrics', 'prometheus'],
  },
  {
    id: '3',
    title: 'Search Service Stub',
    content: 'In-memory search prototype',
    tags: ['search', 'stub'],
  },
  {
    id: '4',
    title: 'ICP Ledger',
    content: 'Wallet and transaction flow',
    tags: ['icp', 'ledger', 'tx'],
  },
  {
    id: '5',
    title: 'Gateway Routing',
    content: 'API Gateway routes and auth',
    tags: ['gateway', 'routing'],
  },
];
