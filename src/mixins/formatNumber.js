export const formatNumber = (value) => {
  if (typeof value !== 'number' || isNaN(value)) {
    return value;
  }

  return new Intl.NumberFormat('en-US').format(value.toFixed());
};
