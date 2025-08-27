export interface Poll {
  id: string;
  title: string;
  description?: string;
  options: PollOption[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  totalVotes: number;
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
  percentage: number;
}

export interface CreatePollData {
  title: string;
  description?: string;
  options: string[];
}

export interface VoteData {
  pollId: string;
  optionId: string;
}

export interface PollResult {
  poll: Poll;
  userVote?: string;
  hasVoted: boolean;
}
