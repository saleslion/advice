
export interface ShopifyProductImage {
  url: string;
  altText?: string;
}

export interface ShopifyProductVariant {
  id: string;
  title: string;
  price: {
    amount: string;
    currencyCode: string;
  };
  // availableForSale: boolean; // Can be added if needed
}

export interface ShopifyProduct {
  id: string; // Shopify GID, e.g., "gid://shopify/Product/12345"
  handle: string; // For URL generation
  title: string;
  description: string; // Plain text description
  descriptionHtml?: string; // HTML description
  productType: string; // Acts as category
  vendor: string;
  tags: string[];
  images: { nodes: ShopifyProductImage[] }; // Adjusted to match GraphQL response
  variants: { nodes: ShopifyProductVariant[] }; // Adjusted to match GraphQL response
  featuredImage?: ShopifyProductImage;
  priceRange?: {
    minVariantPrice: { amount: string; currencyCode: string; };
    maxVariantPrice: { amount: string; currencyCode: string; };
  };
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai' | 'system';
  timestamp: Date;
  isStreaming?: boolean;
  isError?: boolean;
  groundingMetadata?: GroundingMetadata;
}

export interface GroundingChunkWeb {
  uri: string;
  title: string;
}
export interface GroundingChunk {
  web?: GroundingChunkWeb;
}

export interface GroundingMetadata {
  groundingChunks?: GroundingChunk[];
}