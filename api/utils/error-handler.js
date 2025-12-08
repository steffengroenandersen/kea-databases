export const handleDatabaseError = (err, res, dbType) => {
  console.error(`${dbType} error:`, err);

  // Unique constraint violations
  if (
    (dbType === 'postgres' && err.code === '23505') ||
    (dbType === 'mongodb' && err.code === 11000) ||
    (dbType === 'neo4j' && err.code?.includes('ConstraintValidationFailed'))
  ) {
    return res.status(409).json({ error: 'Resource already exists' });
  }

  // Foreign key violations
  if (dbType === 'postgres' && err.code === '23503') {
    return res.status(400).json({ error: 'Referenced resource does not exist' });
  }

  return res.status(500).json({ error: 'Database error' });
};
