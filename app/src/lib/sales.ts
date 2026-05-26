export interface SalesCampaign {
  id: string;
  title: string;
  type: 'flash_sale' | 'special_sale';
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  startDate?: string;
  endDate?: string;
  applyTo: 'all' | 'specific';
  productIds: string[];
  status: 'active' | 'inactive';
}

export const getActiveProductSale = (product: any): { campaign: SalesCampaign; salePrice: number } | null => {
  if (!product || !product.id) return null;

  try {
    const rawCampaigns = localStorage.getItem('aura_sales_campaigns');
    if (!rawCampaigns) return null;

    const campaigns: SalesCampaign[] = JSON.parse(rawCampaigns);
    const now = new Date();

    let bestDiscount = 0;
    let selectedSale: { campaign: SalesCampaign; salePrice: number } | null = null;

    for (const campaign of campaigns) {
      // Validate campaign status
      if (campaign.status !== 'active') continue;

      // Validate date constraints if specified
      if (campaign.startDate) {
        const start = new Date(campaign.startDate);
        if (now < start) continue;
      }
      if (campaign.endDate) {
        const end = new Date(campaign.endDate);
        if (now > end) continue;
      }

      // Check if product is included
      const isEligible = 
        campaign.applyTo === 'all' || 
        (campaign.applyTo === 'specific' && Array.isArray(campaign.productIds) && campaign.productIds.includes(product.id.toString()));

      if (!isEligible) continue;

      // Calculate discount amount
      let discountAmount = 0;
      let calculatedPrice = product.price;

      if (campaign.discountType === 'percentage') {
        discountAmount = (product.price * campaign.discountValue) / 100;
        calculatedPrice = Math.max(0, product.price - discountAmount);
      } else if (campaign.discountType === 'fixed') {
        discountAmount = campaign.discountValue;
        calculatedPrice = Math.max(0, product.price - discountAmount);
      }

      // Track the best discount applied to the product
      if (discountAmount > bestDiscount) {
        bestDiscount = discountAmount;
        selectedSale = {
          campaign,
          salePrice: Number(calculatedPrice)
        };
      }
    }

    return selectedSale;
  } catch (err) {
    console.error('Error parsing sales campaigns:', err);
    return null;
  }
};
