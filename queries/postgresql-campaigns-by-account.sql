-- PostgreSQL Query: Get all campaigns by name for a selected ad account

CREATE OR REPLACE FUNCTION get_campaigns_by_ad_account(p_ad_account_id INTEGER)
RETURNS TABLE (
    meta_campaign_id INTEGER,
    campaign_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        mc.meta_campaign_id,
        mcs.meta_campaign_name AS campaign_name
    FROM meta_campaigns mc
    LEFT JOIN LATERAL (
        SELECT s.meta_campaign_name
        FROM meta_campaigns_snapshot s
        WHERE s.meta_campaign_id = mc.meta_campaign_id
        ORDER BY s.date DESC
        LIMIT 1
    ) mcs ON true
    WHERE mc.meta_ad_account_id = p_ad_account_id
    ORDER BY campaign_name;
END;
$$ LANGUAGE plpgsql;

-- Usage: SELECT * FROM get_campaigns_by_ad_account(1);
