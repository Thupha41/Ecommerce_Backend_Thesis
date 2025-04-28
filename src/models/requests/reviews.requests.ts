export interface IUpsertReview {
    order_id: string;
    product_id: string;
    rating: number;
    comment: string;
    media: string[];
    is_anonymous: boolean;
    shop_id: string;
}
