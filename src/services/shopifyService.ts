import { ShopifyProduct } from '../types'; // Adjusted path
import { SHOPIFY_API_VERSION } from '../constants'; // Adjusted path

// Vite replaces these with actual values at build time if they are defined (e.g., in .env or Vercel UI)
const storeDomain = import.meta.env.VITE_SHOPIFY_STORE_DOMAIN;
const storefrontAccessToken = import.meta.env.VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN;

// Placeholders for checking if actual values are set (these exact strings would signify placeholders if literally set in env)
const SHOPIFY_STORE_DOMAIN_PLACEHOLDER_CHECK = 'YOUR_SHOPIFY_STORE_DOMAIN.myshopify.com';
const SHOPIFY_STOREFRONT_ACCESS_TOKEN_PLACEHOLDER_CHECK = 'YOUR_SHOPIFY_STOREFRONT_ACCESS_TOKEN';


export const fetchShopifyProducts = async (count: number = 20): Promise<ShopifyProduct[]> => {
  if (!storeDomain || storeDomain === SHOPIFY_STORE_DOMAIN_PLACEHOLDER_CHECK || !storefrontAccessToken || storefrontAccessToken === SHOPIFY_STOREFRONT_ACCESS_TOKEN_PLACEHOLDER_CHECK) {
    const errorMessage = 'Shopify store domain or access token is not configured or is using placeholder values. Please set VITE_SHOPIFY_STORE_DOMAIN and VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN environment variables.';
    console.warn(errorMessage);
    throw new Error(errorMessage);
  }

  const storefrontEndpoint = `https://${storeDomain}/api/${SHOPIFY_API_VERSION}/graphql.json`;
  const productsQuery = `
  query GetProducts($first: Int!) {
    products(first: $first, sortKey: TITLE, reverse: false) {
      edges {
        node {
          id
          handle
          title
          description
          descriptionHtml
          productType
          vendor
          tags
          featuredImage {
            url
            altText
          }
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
            maxVariantPrice {
              amount
              currencyCode
            }
          }
          images(first: 5) {
            nodes {
              url
              altText
            }
          }
          variants(first: 5) {
            nodes {
              id
              title
              price {
                amount
                currencyCode
              }
            }
          }
        }
      }
    }
  }
`;

  try {
    const response = await fetch(storefrontEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': storefrontAccessToken,
      },
      body: JSON.stringify({
        query: productsQuery,
        variables: { first: count },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Shopify API Error:', response.status, errorBody);
      throw new Error(\`Shopify API request failed: \${response.status} \${response.statusText}. Response: \${errorBody}\`);
    }

    const jsonResponse = await response.json();

    if (jsonResponse.errors) {
      console.error('Shopify GraphQL Errors:', jsonResponse.errors);
      throw new Error(\`Shopify GraphQL error: \${jsonResponse.errors.map((e: any) => e.message).join(', ')}\`);
    }
    
    const products = jsonResponse.data?.products?.edges?.map((edge: any) => edge.node) || [];
    return products as ShopifyProduct[];

  } catch (error) {
    console.error('Failed to fetch Shopify products:', error);
    throw error;
  }
};

export const generateProductCatalogOverview = (products: ShopifyProduct[], maxLength: number = 15): string => {
  if (!products || products.length === 0) {
    return "No products are currently available in the catalog. I can still offer general advice on Hi-Fi audio.";
  }

  // Use actual newline '\n' for consistency with SYSTEM_PROMPT_TEMPLATE
  let overview = "Our Hifiisti Product Catalog Overview (highlights):\\n"; 
  const productsToDisplay = products.slice(0, maxLength);

  overview += productsToDisplay.map(p => {
    const price = p.variants?.nodes?.[0]?.price?.amount || p.priceRange?.minVariantPrice?.amount || 'N/A';
    const currency = p.variants?.nodes?.[0]?.price?.currencyCode || p.priceRange?.minVariantPrice?.currencyCode || '';
    const shortDesc = p.description ? p.description.substring(0, 70) + (p.description.length > 70 ? '...' : '') : 'No description available.';
    return \`- \${p.title} (Handle: \${p.handle}, Type: \${p.productType || 'Uncategorized'}): \${shortDesc} Price: \${price} \${currency}. Vendor: \${p.vendor}. Tags: \${p.tags.slice(0,3).join(', ')}.\`;
  }).join('\\n'); // Use actual newline '\n' for joining
  
  if (products.length > maxLength) {
    // Use actual newline '\n'
    overview += \`\\n...and \${products.length - maxLength} more products. Ask me about specific types or brands!\`;
  }
  return overview;
};

export const areShopifyCredentialsPlaceholders = (): boolean => {
  const domainIsPlaceholder = import.meta.env.VITE_SHOPIFY_STORE_DOMAIN === SHOPIFY_STORE_DOMAIN_PLACEHOLDER_CHECK;
  const tokenIsPlaceholder = import.meta.env.VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN === SHOPIFY_STOREFRONT_ACCESS_TOKEN_PLACEHOLDER_CHECK;
  const isActuallyUndefined = !import.meta.env.VITE_SHOPIFY_STORE_DOMAIN || !import.meta.env.VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN;

  return domainIsPlaceholder || tokenIsPlaceholder || isActuallyUndefined;
};

export const getShopifyStoreDomain = (): string => import.meta.env.VITE_SHOPIFY_STORE_DOMAIN || "Shopify domain not configured";