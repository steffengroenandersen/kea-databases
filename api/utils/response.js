export const success = (res, data, status = 200) => {
  res.status(status).json({ data });
};

export const created = (res, data) => {
  res.status(201).json({ data });
};

export const error = (res, message, status = 400) => {
  res.status(status).json({ error: message });
};

export const notFound = (res, message = "not found") => {
  res.status(404).json({ error: message });
};
