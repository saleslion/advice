
import { ShopifyProduct } from '../types';
import { SHOPIFY_API_VERSION } from '../constants';

// These will be populated by Vercel dev from .env.development.local or by Vercel's environment variables in deployment.
const storeDomain = process.env.SHOPIFY_STORE_DOMAIN;
const storefrontAccessToken = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;

const SHOPIFY_STORE_DOMAIN_PLACEHOLDER_CHECK = 'YOUR_SHOPIFY_STORE_DOMAIN.myshopify.com'; // Used for placeholder check logic
const SHOPIFY_STOREFRONT_ACCESS_TOKEN_PLACEHOLDER_CHECK = 'YOUR_SHOPIFY_STOREFRONT_ACCESS_TOKEN'; // Used for placeholder check logic


export const fetchShopifyProducts = async (count: number = 20): Promise<ShopifyProduct[]> => {
  if (!storeDomain || storeDomain === SHOPIFY_STORE_DOMAIN_PLACEHOLDER_CHECK || !storefrontAccessToken || storefrontAccessToken === SHOPIFY_STOREFRONT_ACCESS_TOKEN_PLACEHOLDER_CHECK) {
    const errorMessage = 'Shopify store domain or access token is not configured or is using placeholder values. Please set SHOPIFY_STORE_DOMAIN and SHOPIFY_STOREFRONT_ACCESS_TOKEN environment variables.';
    console.warn(errorMessage);
    // In a local dev environment with Vercel, if these aren't set in .env.development.local, this will be the case.
    // We throw an error because the application expects to connect to a real store if not explicitly told it's a placeholder scenario.
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
      throw new Error(`Shopify API request failed: ${response.status} ${response.statusText}. Response: ${errorBody}`);
    }

    const jsonResponse = await response.json();

    if (jsonResponse.errors) {
      console.error('Shopify GraphQL Errors:', jsonResponse.errors);
      throw new Error(`Shopify GraphQL error: ${jsonResponse.errors.map((e: any) => e.message).join(', ')}`);
    }
    
    const products = jsonResponse.data?.products?.edges?.map((edge: any) => edge.node) || [];
    return products as ShopifyProduct[];

  } catch (error) {
    console.error('Failed to fetch Shopify products:', error);
    throw error; // Re-throw to be caught by the caller
  }
};

export const generateProductCatalogOverview = (products: ShopifyProduct[], maxLength: number = 15): string => {
  if (!products || products.length === 0) {
    return "No products are currently available in the catalog. I can still offer general advice on Hi-Fi audio.";
  }

  let overview = "Our Hifiisti Product Catalog Overview (highlights):\n";
  const productsToDisplay = products.slice(0, maxLength);

  overview += productsToDisplay.map(p => {
    const price = p.variants?.nodes?.[0]?.price?.amount || p.priceRange?.minVariantPrice?.amount || 'N/A';
    const currency = p.variants?.nodes?.[0]?.price?.currencyCode || p.priceRange?.minVariantPrice?.currencyCode || '';
    const shortDesc = p.description ? p.description.substring(0, 70) + (p.description.length > 70 ? '...' : '') : 'No description available.';
    return `- ${p.title} (${p.productType || 'Uncategorized'}): ${shortDesc} Price: ${price} ${currency}. Vendor: ${p.vendor}. Tags: ${p.tags.slice(0,3).join(', ')}.`;
  }).join('\n');
  
  if (products.length > maxLength) {
    overview += `\n...and ${products.length - maxLength} more products. Ask me about specific types or brands!`;
  }
  return overview;
};

// Function to check if Shopify credentials might be placeholders (based on known placeholder strings)
export const areShopifyCredentialsPlaceholders = (): boolean => {
  // Check against the specific placeholder strings. If process.env variables are undefined, they won't match these.
  const domainIsPlaceholder = process.env.SHOPIFY_STORE_DOMAIN === SHOPIFY_STORE_DOMAIN_PLACEHOLDER_CHECK;
  const tokenIsPlaceholder = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN === SHOPIFY_STOREFRONT_ACCESS_TOKEN_PLACEHOLDER_CHECK;
  const isActuallyUndefined = !process.env.SHOPIFY_STORE_DOMAIN || !process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;

  // If they are undefined (meaning not set in .env file) OR they match the known placeholder values,
  // then we consider them "placeholders" for the purpose of the app's logic that might try to use simulated data.
  // However, for fetchShopifyProducts, undefined will cause an error, which is correct.
  return domainIsPlaceholder || tokenIsPlaceholder || isActuallyUndefined;
};

export const getShopifyStoreDomain = (): string => process.env.SHOPIFY_STORE_DOMAIN || "Shopify domain not configured";
