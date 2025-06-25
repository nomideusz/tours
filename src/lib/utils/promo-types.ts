export interface PromoCodeBenefits {
  discountPercentage: number;
  freeUntilDate: Date | null;
  isLifetime: boolean;
  discountExpiresAt?: Date;
  description: string;
} 