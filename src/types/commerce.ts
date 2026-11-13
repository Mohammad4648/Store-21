export type BlockchainNetwork = 'polygon' | 'ethereum' | 'arbitrum' | 'base' | 'solana';

export type CryptoCurrency = 'USDC' | 'USDT' | 'ETH' | 'SOL';

export type Product3DModelType = 'watch' | 'perfume' | 'headphones' | 'vault';

export type ProductFinish = 'gold' | 'titanium' | 'platinum' | 'copper';

export type ActiveSection = 'showcase' | 'channels' | 'live' | 'products' | 'integrations';

export interface WalletState {
  connected: boolean;
  address: string;
  network: BlockchainNetwork;
  isRealProvider: boolean;
  balances: Record<CryptoCurrency, number>;
}

export interface Product {
  id: string;
  channelId: string;
  title: string;
  category: string;
  description: string;
  priceUSDC: number;
  stock: number;
  image: string;
  model3d: Product3DModelType;
  finish: ProductFinish;
  sku: string;
  syncedFrom?: string;
  specs: string[];
}

export interface StoreChannel {
  id: string;
  name: string;
  handle: string;
  ownerName: string;
  category: string;
  description: string;
  walletAddress: string;
  verified: boolean;
  followersCount: number;
  connectedPlatform?: string;
  groupName: string;
  groupDescription: string;
  groupMembersCount: number;
  tokenGatedGroup: boolean;
  unreadCount: number;
}

export interface ChannelPost {
  id: string;
  channelId: string;
  text: string;
  productId?: string;
  timestamp: string;
  viewsCount: number;
  likesCount: number;
}

export type PlatformId = 'salla' | 'zid' | 'shopify' | 'woocommerce' | 'amazon' | 'magento';

export interface PlatformIntegration {
  id: PlatformId;
  name: string;
  subtitle: string;
  regionLabel: string;
  status: 'connected' | 'disconnected';
  storeUrl: string;
  apiKeyMasked: string;
  webhookActive: boolean;
  autoSyncInventory: boolean;
  autoSettleCrypto: boolean;
  lastSync: string;
  syncedProductsCount: number;
}

export interface GroupMessage {
  id: string;
  channelId: string;
  authorName: string;
  authorRole: 'merchant' | 'customer';
  text: string;
  timestamp: string;
  attachedProductId?: string;
  reactions: number;
  pinned?: boolean;
}

export interface LiveChatMessage {
  id: string;
  sender: string;
  role: 'merchant' | 'viewer';
  text: string;
  timestamp: string;
}

export interface LiveStreamState {
  id: string;
  channelId: string;
  title: string;
  hostName: string;
  isLive: boolean;
  viewerCount: number;
  likesCount: number;
  pinnedProductId: string;
  flashDiscountPercent: number;
  useWebcam: boolean;
  startedAt: string;
  chatMessages: LiveChatMessage[];
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedFinish: ProductFinish;
}

export interface OnChainOrder {
  id: string;
  txHash: string;
  network: BlockchainNetwork;
  currency: CryptoCurrency;
  amountCrypto: number;
  amountUSDC: number;
  items: { title: string; quantity: number; priceUSDC: number }[];
  escrowStatus: 'مؤمن بالعقد الذكي' | 'مؤكد على السلسلة';
  blockNumber: number;
  timestamp: string;
  channelName: string;
}
