-- Insert a test coupon for testing purposes
INSERT INTO coupons (code, description, discount_type, discount_value, max_uses, is_active)
VALUES ('TEST20', 'Test coupon - 20% korting', 'percentage', 20, 10, 1)
ON CONFLICT (code) DO NOTHING;