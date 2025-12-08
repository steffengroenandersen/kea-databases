-- PostgreSQL Query: Find average spend on all campaigns for benchmarking

CREATE OR REPLACE FUNCTION get_average_campaign_spend()
RETURNS TABLE (
    average_spend NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        AVG(mm.spend) AS average_spend
    FROM meta_metrics mm
    WHERE mm.meta_campaign_id IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Usage: SELECT * FROM get_average_campaign_spend();
