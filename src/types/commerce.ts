export type Language = 'ar' | 'en';

export type PrimarySection = 'home' | 'chats' | 'channels' | 'profile';

export type ProductMediaMode = 'images' | 'video' | 'model3d';

export type Product3DModelType = 'watch' | 'perfume' | 'headphones' | 'vault';

export type ProductFinish = 'gold' | 'titanium' | 'platinum' | 'copper';

export type SupportedCurrency = 'USDT' | 'USDC' | 'ETH' | 'SOL';

export type WalletProviderId = 'metamask' | 'trust' | 'coinbase' | 'walletconnect' | 'solana';

export type PlatformId = 'shopify' | 'woocommerce' | 'salla' | 'zid';

export type IntegrationStatus = 'connected' | 'disconnected' | 'pending' | 'failed';

export type ChannelPostType = 'announcement' | 'product' | 'live';

export interface ProductReview {
  id: string;
  author: string;
  rating: number;
  comment: string;
  commentEn: string;
  date: string;
}

export interface Product {
  id: string;
  channelId: string;
  title: string;
  titleEn: string;
  category: string;
  categoryEn: string;
  description: string;
  descriptionEn: string;
  priceUSD: number;
  compareAtPriceUSD?: number;
  stock: number;
  image: string;
  gallery: string[];
  videoUrl?: string;
  mediaPreference: ProductMediaMode;
  has3D: boolean;
  model3d: Product3DModelType;
  model3dUrl?: string;
  finish: ProductFinish;
  sku: string;
  rating: number;
  reviewCount: number;
  syncedFrom?: PlatformId;
  specs: string[];
  specsEn: string[];
  reviews: ProductReview[];
}

export interface ChannelMember {
  id: string;
  name: string;
  handle: string;
  role: 'owner' | 'moderator' | 'member';
  muted: boolean;
  joinedAt: string;
}

export interface StoreChannel {
  id: string;
  name: string;
  nameEn: string;
  handle: string;
  ownerName: string;
  ownerNameEn: string;
  category: string;
  categoryEn: string;
  description: string;
  descriptionEn: string;
  avatarImage: string;
  bannerImage: string;
  verified: boolean;
  followersCount: number;
  isFollowed?: boolean;
  isMuted?: boolean;
  linkedGroupId: string;
  linkedGroupEnabled: boolean;
  linkedGroupName: string;
  linkedGroupNameEn: string;
  linkedGroupDescription?: string;
  linkedGroupDescriptionEn?: string;
  externalLinks?: { label: string; url: string }[];
  connectedPlatforms: PlatformId[];
  members: ChannelMember[];
}

export interface PostComment {
  id: string;
  author: string;
  text: string;
  timestamp: string;
}

export interface ChannelPost {
  id: string;
  channelId: string;
  type: ChannelPostType;
  text: string;
  textEn: string;
  image?: string;
  videoUrl?: string;
  productId?: string;
  liveViewerCount?: number;
  liveActive?: boolean;
  hasReplay?: boolean;
  liveTitle?: string;
  liveTitleEn?: string;
  liveChat?: { id: string; sender: string; role: 'seller' | 'viewer'; text: string; timestamp: string }[];
  timestamp: string;
  viewsCount: number;
  reactions: {
    heart: number;
    thumbs: number;
    fire: number;
  };
  comments: PostComment[];
}

export interface MessageMediaAttachment {
  kind: 'image' | 'video' | 'file' | 'audio';
  name: string;
  url: string;
  sizeLabel?: string;
  durationSec?: number;
}

export interface ChatMessage {
  id: string;
  threadId: string;
  authorName: string;
  authorHandle: string;
  authorRole: 'seller' | 'member' | 'me';
  text: string;
  timestamp: string;
  edited?: boolean;
  deliveryStatus?: 'sent' | 'delivered' | 'read';
  attachedProductId?: string;
  replyTo?: {
    id: string;
    authorName: string;
    text: string;
  };
  forwardedFrom?: string;
  media?: MessageMediaAttachment;
  reactions: number;
  pinned?: boolean;
}

export interface ChatThread {
  id: string;
  kind: 'direct' | 'group';
  channelId?: string;
  title: string;
  titleEn: string;
  subtitle: string;
  subtitleEn: string;
  avatar: string;
  verified?: boolean;
  online?: boolean;
  lastSeen?: string;
  lastSeenEn?: string;
  membersCount?: number;
  unreadCount: number;
  pinned?: boolean;
}

export interface PlatformIntegration {
  id: PlatformId;
  name: string;
  subtitle: string;
  subtitleEn: string;
  status: IntegrationStatus;
  storeUrl: string;
  apiCredentialMasked: string;
  lastSync: string;
  lastError?: string;
  syncedProductsCount: number;
  channelId?: string;
  capabilities: {
    importProducts: boolean;
    syncStockAndPrice: boolean;
    receiveOrders: boolean;
    syncOrderStatus: boolean;
  };
}

export interface SyncedStoreOrder {
  id: string;
  platform: PlatformId;
  externalOrderNumber: string;
  customerName: string;
  totalUSD: number;
  status: string;
  createdAt: string;
}

export interface CurrencyBalance {
  currency: SupportedCurrency;
  networkLabel: string;
  symbol: SupportedCurrency;
  amount: number;
  usdRate: number;
}

export interface ExternalWalletConnection {
  provider: WalletProviderId;
  label: string;
  address: string;
  chainIdHex?: string;
  networkName: string;
  connectedAt: string;
  readOnly: boolean;
  balances: CurrencyBalance[];
  balanceError?: string;
}

export interface WalletTransactionRecord {
  id: string;
  kind: 'deposit' | 'withdrawal' | 'order_payment';
  source: 'internal' | 'external_onchain';
  currency: SupportedCurrency | 'USD';
  amount: number;
  network: string;
  reference: string;
  status: 'verified_onchain' | 'pending_backend_verification' | 'rejected';
  timestamp: string;
  note?: string;
}

export interface OrderRecord {
  id: string;
  referenceCode: string;
  channelId?: string;
  storeName: string;
  paymentSource: 'internal_ledger' | 'external_wallet' | 'order_intent';
  currency: string;
  totalUSD: number;
  items: { productId: string; title: string; titleEn: string; quantity: number; priceUSD: number }[];
  status: 'verified_onchain' | 'pending_backend_verification' | 'failed';
  txHash?: string;
  timestamp: string;
  customerNote?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedFinish: ProductFinish;
}

export interface UserProfile {
  name: string;
  username: string;
  email: string;
  phone: string;
  bio: string;
  avatar: string;
  verified: boolean;
  roleLabel: string;
  roleLabelEn: string;
  privacy: {
    publicProfile: boolean;
    allowDirectMessages: boolean;
    twoFactorEnabled: boolean;
    showOnlineStatus: boolean;
  };
  notifications: {
    orders: boolean;
    channelPosts: boolean;
    liveBroadcasts: boolean;
    directMessages: boolean;
  };
}

export interface ActiveSession {
  id: string;
  device: string;
  browser: string;
  location: string;
  lastActive: string;
  current: boolean;
}

export interface SupportTicket {
  id: string;
  subject: string;
  message: string;
  status: 'received' | 'open';
  createdAt: string;
}
