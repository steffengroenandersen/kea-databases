-- Connect to the markindex database
\connect markindex

-- View: total spend across all businesses by date
CREATE OR REPLACE VIEW total_spend_all_businesses_by_date AS
SELECT
    m.date,
    SUM(m.spend) AS total_spend
FROM businesses b
JOIN meta_business_managers mbm ON mbm.business_id = b.business_id
JOIN meta_ad_accounts ma ON ma.meta_business_manager_id = mbm.meta_business_manager_id
JOIN meta_metrics m ON m.meta_ad_account_id = ma.meta_ad_account_id
GROUP BY m.date
ORDER BY m.date;
