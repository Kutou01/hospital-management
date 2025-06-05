-- =====================================================
-- CREATE EXEC_SQL FUNCTION
-- Hospital Management System - Create utility function
-- =====================================================

-- Create the exec_sql function to execute dynamic SQL
CREATE OR REPLACE FUNCTION public.exec_sql(sql_query text)
RETURNS TABLE(result jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY EXECUTE sql_query;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error executing SQL: %', SQLERRM;
        RETURN;
END;
$$;
