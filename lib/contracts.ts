export const MAINNET_CONTRACTS = {
  governor: '0xcD6643Cb52FF106CDA23c27f2F85f9004E5aC787' as const,
  token: '0xac0b4771c154359Cb7aA92bBB42B56515F46D1D2' as const,
  timelock: '0xE6E5E7d3051Ad64D6408cD84Eb3Ae83b082b6e22' as const,
};

export const TESTNET_CONTRACTS = {
  governor: '0x88e84158fd976c18f800b9e32f38cff52f69cbd6' as const,
  token: '0xa29c9b8bc5437945330e56ebab83fbbe9f2436a6' as const,
  timelock: '0x0bfb7133b87c655261613633f77fd7d0cd8b9ddc' as const,
};

export const MAINNET_START_BLOCK = 7200000n;

export const TIMELOCK_ABI = [
  {
    name: 'getMinDelay',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

// Council member addresses (known members)
export const COUNCIL_MEMBERS: Record<string, string> = {
  '0x293e96ebbf264ed7715cff2b67850517de70232a': 'LUKSOAgent',
  '0x1089e1c613db8cb91db72be4818632153e62557a': 'Emmet',
  '0x1e0267b7e88b97d5037e410bdc61d105e04ca02a': 'Leo',
  '0xdb4dad79d8508656c6176408b25bead5d383e450': 'Ampy',
};

export const COUNCIL_MEMBER_LIST = [
  {
    name: 'LUKSOAgent',
    role: 'Chain sentinel',
    status: 'active',
    note: 'Tracks proposals, publishes governance state, and operates the council control surface.',
    address: '0x293e96ebbf264ed7715cff2b67850517de70232a',
  },
  {
    name: 'Emmet',
    role: 'Execution lead',
    status: 'active',
    note: 'Handles deployment parameters and execution follow-through on approved actions.',
    address: '0x1089e1c613db8cb91db72be4818632153e62557a',
  },
  {
    name: 'Leo',
    role: 'Verification lead',
    status: 'active',
    note: 'Validates bytecode, lifecycle assumptions, and on-chain governance configuration.',
    address: '0x1e0267b7e88b97d5037e410bdc61d105e04ca02a',
  },
  {
    name: 'Ampy',
    role: 'Council member',
    status: 'limited',
    note: 'Participation has been inconsistent, but vote history still matters for council context.',
    address: '0xdb4dad79d8508656c6176408b25bead5d383e450',
  },
] as const;

export const GOVERNOR_ABI = [
  {
    name: 'ProposalCreated',
    type: 'event',
    inputs: [
      { name: 'proposalId', type: 'uint256', indexed: false },
      { name: 'proposer', type: 'address', indexed: false },
      { name: 'targets', type: 'address[]', indexed: false },
      { name: 'values', type: 'uint256[]', indexed: false },
      { name: 'signatures', type: 'string[]', indexed: false },
      { name: 'calldatas', type: 'bytes[]', indexed: false },
      { name: 'voteStart', type: 'uint256', indexed: false },
      { name: 'voteEnd', type: 'uint256', indexed: false },
      { name: 'description', type: 'string', indexed: false },
    ],
  },
  {
    name: 'VoteCast',
    type: 'event',
    inputs: [
      { name: 'voter', type: 'address', indexed: true },
      { name: 'proposalId', type: 'uint256', indexed: false },
      { name: 'support', type: 'uint8', indexed: false },
      { name: 'weight', type: 'uint256', indexed: false },
      { name: 'reason', type: 'string', indexed: false },
    ],
  },
  {
    name: 'VoteCastWithParams',
    type: 'event',
    inputs: [
      { name: 'voter', type: 'address', indexed: true },
      { name: 'proposalId', type: 'uint256', indexed: false },
      { name: 'support', type: 'uint8', indexed: false },
      { name: 'weight', type: 'uint256', indexed: false },
      { name: 'reason', type: 'string', indexed: false },
      { name: 'params', type: 'bytes', indexed: false },
    ],
  },
  {
    name: 'state',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'proposalId', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint8' }],
  },
  {
    name: 'proposalVotes',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'proposalId', type: 'uint256' }],
    outputs: [
      { name: 'againstVotes', type: 'uint256' },
      { name: 'forVotes', type: 'uint256' },
      { name: 'abstainVotes', type: 'uint256' },
    ],
  },
  {
    name: 'hasVoted',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'proposalId', type: 'uint256' },
      { name: 'account', type: 'address' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'castVoteWithReason',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'proposalId', type: 'uint256' },
      { name: 'support', type: 'uint8' },
      { name: 'reason', type: 'string' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'propose',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'targets', type: 'address[]' },
      { name: 'values', type: 'uint256[]' },
      { name: 'calldatas', type: 'bytes[]' },
      { name: 'description', type: 'string' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'proposalDeadline',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'proposalId', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'proposalSnapshot',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'proposalId', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'quorum',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'blockNumber', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'quorumNumerator',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'votingPeriod',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'getVotes',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'account', type: 'address' },
      { name: 'blockNumber', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'queue',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'targets', type: 'address[]' },
      { name: 'values', type: 'uint256[]' },
      { name: 'calldatas', type: 'bytes[]' },
      { name: 'descriptionHash', type: 'bytes32' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'execute',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'targets', type: 'address[]' },
      { name: 'values', type: 'uint256[]' },
      { name: 'calldatas', type: 'bytes[]' },
      { name: 'descriptionHash', type: 'bytes32' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

export const TOKEN_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'getVotes',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'delegate',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'delegatee', type: 'address' }],
    outputs: [],
  },
  {
    name: 'delegates',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    name: 'totalSupply',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'getPastVotes',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'account', type: 'address' },
      { name: 'blockNumber', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

export const PROPOSAL_STATES: Record<number, string> = {
  0: 'Pending',
  1: 'Active',
  2: 'Canceled',
  3: 'Defeated',
  4: 'Succeeded',
  5: 'Queued',
  6: 'Expired',
  7: 'Executed',
};

export const PROPOSAL_STATE_COLORS: Record<number, string> = {
  0: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  1: 'text-green-400 bg-green-400/10 border-green-400/20',
  2: 'text-gray-400 bg-gray-400/10 border-gray-400/20',
  3: 'text-red-400 bg-red-400/10 border-red-400/20',
  4: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  5: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  6: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  7: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
};
