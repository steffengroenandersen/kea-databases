-- PostgreSQL Query: Get all MetaAdAccounts by name

CREATE OR REPLACE FUNCTION get_all_meta_ad_accounts_by_name()
RETURNS TABLE (
    meta_ad_account_id INTEGER,
    meta_ad_account_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        maa.meta_ad_account_id,
        maas.meta_ad_account_name
    FROM meta_ad_accounts maa
    LEFT JOIN LATERAL (
        SELECT s.meta_ad_account_name
        FROM meta_ad_accounts_snapshot s
        WHERE s.meta_ad_account_id = maa.meta_ad_account_id
        ORDER BY s.date DESC
        LIMIT 1
    ) maas ON true
    ORDER BY maas.meta_ad_account_name;
END;
$$ LANGUAGE plpgsql;

-- Usage: SELECT * FROM get_all_meta_ad_accounts_by_name();
